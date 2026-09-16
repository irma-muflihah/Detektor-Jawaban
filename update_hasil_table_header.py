import re

with open('src/views/Hasil.vue', 'r') as f:
    content = f.read()

# I will just replace the `tableHeaders` definition to add a custom header class or use the text-caption classes.
# But wait, v-data-table allows `class: 'text-caption'` on header objects? No, Vuetify 3 uses something else, or we can just apply a global class. Let's look at Vuetify 3 v-data-table headers. 
pass
