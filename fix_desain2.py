import re

with open('src/views/Desain.vue', 'r') as f:
    content = f.read()

# Replace getBlockDimensions
content = content.replace("if (block.type === 'handwritten_identity') return { width: 820, height: 120 };",
                          "if (block.type === 'handwritten_identity') return { width: 820, height: 220 };")

# Replace autoLayoutBlocks for handwrittenBlock.y
content = content.replace("currentY += 120 + GAP_Y;", "currentY += 220 + GAP_Y;")

with open('src/views/Desain.vue', 'w') as f:
    f.write(content)
