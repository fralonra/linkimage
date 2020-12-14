import {
  CV_32FC2,
  DescriptorMatch,
  findHomography,
  imdecode,
  KeyPoint,
  Mat,
  matchKnnFlannBased,
  Point2,
  RANSAC,
  SIFTDetector,
  Vec2,
} from 'opencv4nodejs'
import { tensor } from '@tensorflow/tfjs-node'

type Point = [number, number]

const MIN_MATCH_COUNT = 6
const sift = new SIFTDetector()

function getPoints(
  matches: DescriptorMatch[][],
  keypoints: KeyPoint[],
  key: string
): Point2[] {
  const ptsArray = tensor([
    ...matches.map(([a]: DescriptorMatch[]) => {
      const pt = keypoints[a[key]].pt
      return [pt.y, pt.x]
    }),
  ])
    .reshape([-1, 1, 2])
    .arraySync() as number[][][]
  return ptsArray.map((pt) => new Point2(pt[0][1], pt[0][0]))
}

function link(srcBuffer: Buffer, dstBuffer: Buffer, point?: Point): Point {
  const srcMat = imdecode(srcBuffer)
  const dstMat = imdecode(dstBuffer)

  const srcKPts = sift.detect(srcMat)
  const dstKPts = sift.detect(dstMat)

  const srcComputedMat = sift.compute(srcMat, srcKPts)
  const dstComputedMat = sift.compute(dstMat, dstKPts)

  const matches = matchKnnFlannBased(srcComputedMat, dstComputedMat, 2)

  const goodMatches = matches.filter(([a, b]) => a.distance < 0.7 * b.distance)

  if (goodMatches.length < MIN_MATCH_COUNT) return [-1, -1]

  const srcPts = getPoints(goodMatches, srcKPts, 'queryIdx')
  const dstPts = getPoints(goodMatches, dstKPts, 'trainIdx')

  const { rows, cols } = srcMat

  const { homography } = findHomography(srcPts, dstPts, RANSAC, 5)

  const pointArr = point
    ? [point[0], point[1]]
    : [(cols - 1) * 0.5, (rows - 1) * 0.5]
  const pt = tensor([pointArr]).reshape([-1, 1, 2]).arraySync() as number[][][]
  const ptMat = new Mat(pt, CV_32FC2)

  const resultMat = ptMat.perspectiveTransform(homography)
  const resultPt = (resultMat.at(0, 0) as unknown) as Vec2
  return [resultPt.x, resultPt.y]
}

export { link }
