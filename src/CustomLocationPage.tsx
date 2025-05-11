import '@ir-engine/client/src/engine'

import '@ir-engine/spatial'

import {
  EntityTreeComponent,
  UndefinedEntity,
  createEntity,
  defineSystem,
  getComponent,
  setComponent
} from '@ir-engine/ecs'
import { ECSState } from '@ir-engine/ecs/src/ECSState'
import { defineState, getMutableState, getState, useImmediateEffect, useMutableState } from '@ir-engine/hyperflux'
import { ReferenceSpaceState } from '@ir-engine/spatial'
import { NameComponent } from '@ir-engine/spatial/src/common/NameComponent'
import { Vector3_Up, Vector3_Zero } from '@ir-engine/spatial/src/common/constants/MathConstants'
import { destroySpatialEngine, initializeSpatialEngine } from '@ir-engine/spatial/src/initializeEngine'
import { MeshComponent } from '@ir-engine/spatial/src/renderer/components/MeshComponent'
import { VisibleComponent } from '@ir-engine/spatial/src/renderer/components/VisibleComponent'
import { useEngineCanvas } from '@ir-engine/spatial/src/renderer/functions/useEngineCanvas'
import { TransformComponent } from '@ir-engine/spatial/src/transform/components/TransformComponent'
import { TransformSystem } from '@ir-engine/spatial/src/transform/systems/TransformSystem'

import React, { useEffect, useRef } from 'react'
import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial } from 'three'

const SceneState = defineState({
  name: 'ir.minimalist.SceneState',
  initial: {
    entity: UndefinedEntity
  }
})

const UpdateSystem = defineSystem({
  uuid: 'ir.minimalist.UpdateSystem',
  insert: { before: TransformSystem },
  execute: () => {
    const entity = getState(SceneState).entity
    if (!entity) return

    const elapsedSeconds = getState(ECSState).elapsedSeconds
    const transformComponent = getComponent(entity, TransformComponent)
    transformComponent.rotation.setFromAxisAngle(Vector3_Up, elapsedSeconds)
  },
  reactor: function () {
    const { originEntity, viewerEntity } = useMutableState(ReferenceSpaceState).value

    useEffect(() => {
      if (!viewerEntity) return

      // Create a new entity
      const entity = createEntity()
      setComponent(entity, TransformComponent)
      setComponent(entity, EntityTreeComponent, { parentEntity: originEntity })

      // Create a box at the origin
      const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x00ff00 }))
      setComponent(entity, MeshComponent, mesh)
      setComponent(entity, NameComponent, 'Box')
      setComponent(entity, VisibleComponent)

      // Make the camera look at the box
      const cameraTransform = getComponent(viewerEntity, TransformComponent)
      cameraTransform.position.set(5, 2, 0)
      cameraTransform.rotation.setFromRotationMatrix(
        new Matrix4().lookAt(cameraTransform.position, Vector3_Zero, Vector3_Up)
      )

      getMutableState(SceneState).entity.set(entity)
    }, [viewerEntity])

    return null
  }
})

export default function Template() {
  const ref = useRef(document.body)

  useImmediateEffect(() => {
    initializeSpatialEngine()
    return () => {
      destroySpatialEngine()
    }
  }, [])

  useEngineCanvas(ref)

  return <></>
}
