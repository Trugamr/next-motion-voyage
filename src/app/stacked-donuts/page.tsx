'use client'

import { arc } from 'd3'
import { Fragment, useRef } from 'react'
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useTransform,
  useSpring,
  SpringOptions,
} from 'framer-motion'

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start)
}

const layersCount = 4
const layerItemsCount = 8

function randomImageBetweenSizes({
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
}: {
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
}) {
  const width = Math.floor(Math.random() * (maxWidth - minWidth + 1) + minWidth)
  const height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight)
  return `https://picsum.photos/${width}/${height}`
}

const layers = Array.from({ length: layersCount }).map((_, layerIndex) =>
  Array.from({ length: layerItemsCount }).map((_, itemIndex) => ({
    id: itemIndex + 1 + layerIndex * layerItemsCount,
    image: randomImageBetweenSizes({
      minWidth: 180,
      maxWidth: 300,
      minHeight: 140,
      maxHeight: 200,
    }),
  })),
)

export default function StackedDonutDemo() {
  return (
    <div className="h-screen">
      <section className="flex h-screen items-center justify-center">
        <p>Scroll down to see the scroll effect</p>
      </section>
      <StackedDonuts />
      <section className="flex h-screen items-center justify-center">
        <p>Scroll back up to see the scroll effect</p>
      </section>
    </div>
  )
}

function StackedDonuts() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })
  const rotateClockwise = useTransform(scrollYProgress, [0, 1], [0, 90])
  const rotateCounterClockwise = useTransform(scrollYProgress, [0, 1], [0, -90])

  const springConfig: SpringOptions = {
    damping: 40,
    stiffness: 100,
  }

  const rotateClockwiseSpring = useSpring(rotateClockwise, springConfig)
  const rotateCounterClockwiseSpring = useSpring(rotateCounterClockwise, springConfig)

  const viewBox = '-175 -175 350 350'

  const startInnerRadius = 80
  const startRingHeight = 32
  const startRingGap = 4
  const ringSegmentPadding = 0.02

  function getArcProps(layerIndex: number): { innerRadius: number; outerRadius: number } {
    if (layerIndex === 0) {
      return {
        innerRadius: startInnerRadius,
        outerRadius: startInnerRadius + startRingHeight - startRingGap,
      }
    }

    const previousArcProps = getArcProps(layerIndex - 1)

    const ringGap = startRingGap + layerIndex * startRingGap * 0.75
    const ringHeight = startRingHeight + layerIndex * startRingHeight * 0.5
    const innerRadius = previousArcProps.outerRadius + ringGap

    return {
      innerRadius,
      outerRadius: innerRadius + ringHeight,
    }
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg ref={svgRef} width="100%" height="100%">
        {layers.map((layer, layerIndex) => {
          const { innerRadius, outerRadius } = getArcProps(layerIndex)

          // We need to double the items to account for the gaps
          const items = range(0, layerItemsCount * 2 - 1).map((_, index) => {
            // Insert null for alternating items
            if ((index + layerIndex) % 2 === 0) return null
            return layer[Math.floor(index / 2)]
          })

          const generator = arc<(typeof items)[number]>()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .startAngle((_, index) => (index / items.length) * Math.PI * 2)
            .endAngle((_, index) => ((index + 1) / items.length) * Math.PI * 2)
            .padAngle(ringSegmentPadding)

          const rotateSpring =
            layerIndex % 2 === 0 ? rotateCounterClockwiseSpring : rotateClockwiseSpring

          return (
            <Fragment key={layerIndex}>
              <motion.svg viewBox={viewBox}>
                <motion.g style={{ rotate: rotateSpring }}>
                  {items.map((item, itemIndex) => {
                    return (
                      <path
                        key={itemIndex}
                        d={generator(item, itemIndex) ?? undefined}
                        className={item ? 'fill-gray-100' : 'fill-transparent'}
                      />
                    )
                  })}
                </motion.g>
              </motion.svg>
              <motion.svg viewBox={viewBox}>
                <motion.g style={{ rotate: rotateSpring }}>
                  {items.map((item, itemIndex) => {
                    const angle = ((itemIndex + 0.5) / items.length) * 2 * Math.PI - Math.PI / 2 // Adjusted for starting from top
                    const radius = (innerRadius + outerRadius) / 2
                    const x = radius * Math.sin(angle)
                    const y = -radius * Math.cos(angle)
                    const imageSize = 20 * (0.45 * layerIndex + 1) // Set the size of the image

                    if (!item) {
                      return null
                    }

                    return (
                      <image
                        key={itemIndex}
                        href={item.image} // Use the image URL from the item
                        x={x - imageSize / 2} // Adjust positioning based on image size
                        y={y - imageSize / 2} // Adjust positioning based on image size
                        width={imageSize}
                        height={imageSize}
                        transform={`rotate(${angle * (180 / Math.PI)}, ${x}, ${y})`} // Rotate based on the angle
                      />
                    )
                  })}
                </motion.g>
              </motion.svg>
            </Fragment>
          )
        })}
      </svg>
    </div>
  )
}
