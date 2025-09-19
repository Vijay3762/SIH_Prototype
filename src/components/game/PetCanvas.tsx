'use client'

import { useEffect, useRef } from 'react'
import { Pet } from '@/types'

interface PetCanvasProps {
  pet: Pet
  onInteraction: (type: string) => void
}

export default function PetCanvas({ pet, onInteraction }: PetCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Phaser game when component mounts
    initializePhaserGame()

    return () => {
      // Cleanup Phaser game when component unmounts
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Update pet state when pet prop changes
    if (gameRef.current && gameRef.current.scene.scenes[0]) {
      updatePetState()
    }
  }, [pet.health, pet.happiness, pet.hunger, pet.growth_stage])

  const initializePhaserGame = async () => {
    if (typeof window === 'undefined') return

    // Dynamically import Phaser to avoid SSR issues
    const Phaser = await import('phaser')

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 400,
      parent: canvasRef.current!,
      backgroundColor: 'transparent',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    }

    gameRef.current = new Phaser.Game(config)
  }

  const preload = function (this: Phaser.Scene) {
    // For now, we'll create simple colored rectangles as placeholders
    // In a full implementation, you'd load actual sprite images
    this.load.image('egg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
    this.load.image('baby', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
    this.load.image('child', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
    this.load.image('adult', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
    this.load.image('elder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
  }

  const create = function (this: Phaser.Scene) {
    const scene = this
    
    // Create pet sprite based on growth stage and species
    const petSprite = createPetSprite(scene, pet)
    
    // Add click interaction
    petSprite.setInteractive()
    petSprite.on('pointerdown', () => {
      // Play animation and trigger interaction
      playPetAnimation(petSprite, 'happy')
      onInteraction('click')
    })

    // Store reference to pet sprite
    scene.data.set('petSprite', petSprite)
    
    // Add idle animation loop
    scene.time.addEvent({
      delay: 3000,
      callback: () => {
        playIdleAnimation(petSprite)
      },
      loop: true
    })
  }

  const update = function (this: Phaser.Scene) {
    // Update animations based on pet state
    const petSprite = this.data.get('petSprite')
    if (petSprite) {
      updatePetAnimationState(petSprite, pet)
    }
  }

  const createPetSprite = (scene: Phaser.Scene, petData: Pet) => {
    const centerX = scene.cameras.main.width / 2
    const centerY = scene.cameras.main.height / 2

    // Create a colored circle as placeholder for the pet
    const graphics = scene.add.graphics()
    const color = getPetColor(petData.species, petData.growth_stage)
    const size = getPetSize(petData.growth_stage)
    
    graphics.fillStyle(color)
    graphics.fillCircle(centerX, centerY, size)
    
    // Add simple face
    graphics.fillStyle(0x000000)
    graphics.fillCircle(centerX - size/3, centerY - size/4, size/8) // left eye
    graphics.fillCircle(centerX + size/3, centerY - size/4, size/8) // right eye
    graphics.fillCircle(centerX, centerY + size/4, size/6) // nose/mouth
    
    // Add species-specific features
    addSpeciesFeatures(graphics, petData.species, centerX, centerY, size)
    
    // Add accessories
    petData.accessories.forEach((accessory, index) => {
      addAccessory(graphics, accessory, centerX, centerY - size - 10 - (index * 15), size)
    })

    graphics.setInteractive(new Phaser.Geom.Circle(centerX, centerY, size), Phaser.Geom.Circle.Contains)
    
    return graphics
  }

  const getPetColor = (species: string, stage: string): number => {
    const colors = {
      'eco-turtle': { egg: 0x8B4513, baby: 0x90EE90, child: 0x228B22, adult: 0x006400, elder: 0x004225 },
      'nature-fox': { egg: 0xD2691E, baby: 0xFF8C00, child: 0xFF6347, adult: 0xFF4500, elder: 0xB22222 },
      'green-dragon': { egg: 0x2F4F2F, baby: 0x32CD32, child: 0x00FF00, adult: 0x008000, elder: 0x006400 },
      'earth-rabbit': { egg: 0xDEB887, baby: 0xF5DEB3, child: 0xD2B48C, adult: 0xBC8F8F, elder: 0x8B7355 }
    }
    return colors[species as keyof typeof colors]?.[stage as keyof typeof colors['eco-turtle']] || 0x32CD32
  }

  const getPetSize = (stage: string): number => {
    const sizes = { egg: 20, baby: 30, child: 45, adult: 60, elder: 75 }
    return sizes[stage as keyof typeof sizes] || 30
  }

  const addSpeciesFeatures = (graphics: Phaser.GameObjects.Graphics, species: string, x: number, y: number, size: number) => {
    switch (species) {
      case 'eco-turtle':
        // Add shell pattern
        graphics.lineStyle(2, 0x654321)
        graphics.strokeCircle(x, y, size * 0.8)
        break
      case 'nature-fox':
        // Add ears
        graphics.fillStyle(0xFF4500)
        graphics.fillTriangle(x - size/2, y - size, x - size/3, y - size/2, x - size/6, y - size)
        graphics.fillTriangle(x + size/2, y - size, x + size/3, y - size/2, x + size/6, y - size)
        break
      case 'green-dragon':
        // Add horns
        graphics.fillStyle(0x228B22)
        graphics.fillTriangle(x - size/3, y - size, x - size/6, y - size/2, x, y - size)
        graphics.fillTriangle(x + size/3, y - size, x + size/6, y - size/2, x, y - size)
        break
      case 'earth-rabbit':
        // Add long ears
        graphics.fillStyle(0xD2B48C)
        graphics.fillEllipse(x - size/4, y - size, size/8, size/2)
        graphics.fillEllipse(x + size/4, y - size, size/8, size/2)
        break
    }
  }

  const addAccessory = (graphics: Phaser.GameObjects.Graphics, accessory: any, x: number, y: number, size: number) => {
    graphics.fillStyle(0xFFD700) // Gold color for accessories
    graphics.fillRect(x - 20, y, 40, 8) // Simple rectangle as accessory placeholder
  }

  const playPetAnimation = (sprite: Phaser.GameObjects.Graphics, animationType: string) => {
    const scene = sprite.scene
    
    switch (animationType) {
      case 'happy':
        // Bounce animation
        scene.tweens.add({
          targets: sprite,
          y: sprite.y - 20,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        })
        break
      case 'eat':
        // Shake animation
        scene.tweens.add({
          targets: sprite,
          x: sprite.x + 5,
          duration: 50,
          yoyo: true,
          repeat: 5
        })
        break
      default:
        // Default pulse animation
        scene.tweens.add({
          targets: sprite,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 300,
          yoyo: true,
          ease: 'Power2'
        })
    }
  }

  const playIdleAnimation = (sprite: Phaser.GameObjects.Graphics) => {
    // Gentle breathing animation
    sprite.scene.tweens.add({
      targets: sprite,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      ease: 'Sine.easeInOut'
    })
  }

  const updatePetAnimationState = (sprite: Phaser.GameObjects.Graphics, petData: Pet) => {
    // Change pet appearance based on health/happiness
    if (petData.health < 30 || petData.happiness < 30) {
      sprite.alpha = 0.7 // Make pet look sad/sick
    } else if (petData.health > 80 && petData.happiness > 80) {
      sprite.alpha = 1.0 // Healthy and happy
    } else {
      sprite.alpha = 0.85 // Neutral state
    }
  }

  const updatePetState = () => {
    // This function is called when pet props change
    if (gameRef.current && gameRef.current.scene.scenes[0]) {
      const scene = gameRef.current.scene.scenes[0]
      const petSprite = scene.data.get('petSprite')
      if (petSprite) {
        updatePetAnimationState(petSprite, pet)
      }
    }
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div 
        ref={canvasRef} 
        className="rounded-lg overflow-hidden shadow-lg"
        style={{ width: '400px', height: '400px' }}
      />
      
      {/* Pet Status Overlay */}
      <div className="absolute top-4 left-4 bg-white/80 rounded-lg p-2 text-xs">
        <div className="font-semibold text-gray-800">{pet.name}</div>
        <div className="text-gray-600 capitalize">{pet.growth_stage} {pet.species.replace('-', ' ')}</div>
      </div>
      
      {/* Interaction Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500/80 text-white px-3 py-1 rounded-full text-xs">
        Click to interact! 🎮
      </div>
    </div>
  )
}