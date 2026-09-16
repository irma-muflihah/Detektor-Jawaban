import re

with open('src/router/index.ts', 'r') as f:
    content = f.read()

new_route = """    {
      path: '/nilai',
      name: 'Nilai',
      component: () => import('../views/Nilai.vue')
    },
    {
      path: '/analisis',
      name: 'Analisis',
      component: () => import('../views/Analisis.vue')
    }"""

content = content.replace("""    {
      path: '/nilai',
      name: 'Nilai',
      component: () => import('../views/Nilai.vue')
    }""", new_route)

with open('src/router/index.ts', 'w') as f:
    f.write(content)

