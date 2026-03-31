export const SceneSchema = {
  version: 1,

  components: {
    transform: {
      fields: ['position', 'rotation', 'scale'],
    },

    model: {
      fields: ['type', 'asset'],
    },

    script: {
      fields: ['scripts'],
    },

    light: {
      fields: ['type', 'color', 'intensity'],
    },

    camera: {
      fields: ['fov', 'nearClip', 'farClip'],
    },

    animation: {
      fields: ['assets'],
    },
  },

  entity: {
    required: ['name', 'components'],
  },
} as const
