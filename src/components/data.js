export const initForceProperties = {
  center: {
    x: 0.5,
    y: 0.5
  },
  charge: {
    enabled: true,
    strength: -300,
    distanceMin: 1,
    distanceMax: 2000
  },
  collide: {
    enabled: false,
    strength: .7,
    iterations: 1,
    radius: 35
  },
  forceX: {
    enabled: false,
    strength: 1,
    x: .5
  },
  forceY: {
    enabled: false,
    strength: 1,
    y: .5
  },
  link: {
    enabled: true,
    distance: 200,
    iterations: 1
  }
}

export const initData = {
  nodes: [
    { name: 'firmware', group: 1, class: 'system' },
    { name: 'loader', group: 1, class: 'system' },
    { name: 'kernel', group: 1, class: 'system' },
    { name: 'systemd', group: 1, class: 'mount' },
    { name: '-.mount', group: 1, class: 'mount' },
    { name: 'init.scope', group: 1, class: 'init' },
    { name: 'system.slice', group: 1, class: 'init' },
    { name: 'system-getty.slice', group: 1, class: 'init' },
    { name: 'systemd-initctl.socker', group: 1, class: 'init' },
    { name: 'tmp.mount', group: 1, class: 'init' },
    { name: 'sys-devices', group: 2, class: 'init' },
    { name: 'boot.mount', group: 2, class: 'init' }
  ],
  links: [
    { source: 0, target: 1, value: 2, type: 'depends' },
    { source: 1, target: 2, value: 1, type: 'depends' },
    { source: 2, target: 1, value: 8, type: 'depends' },
    { source: 3, target: 2, value: 6, type: 'depends' },
    { source: 4, target: 3, value: 1, type: 'needs' },
    { source: 5, target: 3, value: 1, type: 'needs' },
    { source: 6, target: 3, value: 1, type: 'needs' },
    { source: 7, target: 3, value: 1, type: 'needs' },
    { source: 8, target: 3, value: 2, type: 'needs' },
    { source: 9, target: 3, value: 1, type: 'needs' },
    { source: 11, target: 10, value: 1, type: 'depends' },
    { source: 11, target: 3, value: 3, type: 'depends' },
    { source: 11, target: 2, value: 3, type: 'depends' },
    { source: 11, target: 3, value: 5, type: 'needs' }
  ]
}
