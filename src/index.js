const cv = require('opencv4nodejs')
const tf = require('@tensorflow/tfjs-node')

const MIN_MATCH_COUNT = 6
const sift = new cv.SIFTDetector()

function link(srcBuffer, dstBuffer, point) {
  const srcMat = imageBufferToMat(srcBuffer)
  const dstMat = imageBufferToMat(dstBuffer)

  const srcKPts = sift.detect(srcMat)
  const dstKPts = sift.detect(dstMat)

  const srcComputedMat = sift.compute(srcMat, srcKPts)
  const dstComputedMat = sift.compute(dstMat, dstKPts)

  const matches = cv.matchKnnFlannBased(srcComputedMat, dstComputedMat, 2)

  const goodMatches = matches.filter(([a, b]) => a.distance < 0.7 * b.distance)

  if (goodMatches.length < MIN_MATCH_COUNT) return [-1, -1]

  const srcPts = tf
    .tensor([
      ...goodMatches.map(([a]) => {
        const pt = srcKPts[a.queryIdx].pt
        return [pt.y, pt.x]
      }),
    ])
    .reshape([-1, 1, 2])
    .arraySync()
    .map((pt) => new cv.Point2(pt[0][1], pt[0][0]))
  const dstPts = tf
    .tensor([
      ...goodMatches.map(([a]) => {
        const pt = dstKPts[a.trainIdx].pt
        return [pt.y, pt.x]
      }),
    ])
    .reshape([-1, 1, 2])
    .arraySync()
    .map((pt) => new cv.Point2(pt[0][1], pt[0][0]))

  const { rows, cols } = srcMat

  const { homography } = cv.findHomography(srcPts, dstPts, cv.RANSAC, 5)

  const pointArr = point
    ? [point[0], point[1]]
    : [(cols - 1) * 0.5, (rows - 1) * 0.5]
  const pt = tf.tensor([pointArr]).reshape([-1, 1, 2]).arraySync()
  const ptMat = new cv.Mat(pt, cv.CV_32FC2)

  const resultMat = ptMat.perspectiveTransform(homography)
  const resultPt = resultMat.at(0, 0)
  return [resultPt.x, resultPt.y]
}

function imageBufferToMat(imgBuffer) {
  return cv.imdecode(imgBuffer)
}

module.exports = {
  link,
}
