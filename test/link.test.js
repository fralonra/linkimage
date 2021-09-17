const fs = require('fs')
const path = require('path')
const { imread } = require('opencv4nodejs')
const { link, linkMat } = require('../src')

const aPath = path.resolve(__dirname, 'images/a.jpg')
const bPath = path.resolve(__dirname, 'images/b.jpg')
const cPath = path.resolve(__dirname, 'images/c.jpg')

describe('link', () => {
  const aBuffer = fs.readFileSync(aPath)
  const bBuffer = fs.readFileSync(bPath)
  const cBuffer = fs.readFileSync(cPath)

  test('should find the corresponding point between images', () => {
    const point = link(aBuffer, aBuffer)
    expect(Math.round(point[0])).toBe(200)
    expect(Math.round(point[1])).toBe(200)
  })

  test('should find the corresponding point between different images', () => {
    const point = link(aBuffer, cBuffer)
    expect(Math.round(point[0])).toBe(400)
    expect(Math.round(point[1])).toBe(400)
  })

  test('should return [-1, -1] if no corresponding point found', () => {
    const point = link(aBuffer, bBuffer)
    expect(point).toEqual([-1, -1])
  })

  test('use central point as default', () => {
    const point = link(aBuffer, aBuffer)
    expect(Math.round(point[0])).toBe(200)
    expect(Math.round(point[1])).toBe(200)
  })

  test('use given point', () => {
    const point = link(aBuffer, aBuffer, [100, 100])
    expect(Math.round(point[0])).toBe(100)
    expect(Math.round(point[1])).toBe(100)
  })
})

describe('linkMat', () => {
  const aMat = imread(aPath)
  const bMat = imread(bPath)
  const cMat = imread(cPath)

  test('should find the corresponding point between images', () => {
    const point = linkMat(aMat, aMat)
    expect(Math.round(point[0])).toBe(200)
    expect(Math.round(point[1])).toBe(200)
  })

  test('should find the corresponding point between different images', () => {
    const point = linkMat(aMat, cMat)
    expect(Math.round(point[0])).toBe(400)
    expect(Math.round(point[1])).toBe(400)
  })

  test('should return [-1, -1] if no corresponding point found', () => {
    const point = linkMat(aMat, bMat)
    expect(point).toEqual([-1, -1])
  })

  test('use central point as default', () => {
    const point = linkMat(aMat, aMat)
    expect(Math.round(point[0])).toBe(200)
    expect(Math.round(point[1])).toBe(200)
  })

  test('use given point', () => {
    const point = linkMat(aMat, aMat, [100, 100])
    expect(Math.round(point[0])).toBe(100)
    expect(Math.round(point[1])).toBe(100)
  })
})
