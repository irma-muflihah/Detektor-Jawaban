import json

with open('package.json', 'r') as f:
    data = json.load(f)
data['name'] = 'dejamu'
with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

with open('metadata.json', 'r') as f:
    data = json.load(f)
data['name'] = 'DEJAMU'
if 'description' in data:
    data['description'] = data['description'].replace('OMROJEN', 'DEJAMU').replace('Sistem OMR SMPN 2 Kemranjen', 'Detektor Jawaban Murid')
with open('metadata.json', 'w') as f:
    json.dump(data, f, indent=2)

with open('index.html', 'r') as f:
    html = f.read()
html = html.replace('OMROJEN - Sistem OMR SMPN 2 Kemranjen', 'DEJAMU - Detektor Jawaban Murid')
html = html.replace('OMROJEN', 'DEJAMU')
with open('index.html', 'w') as f:
    f.write(html)

with open('src/App.vue', 'r') as f:
    app_vue = f.read()
app_vue = app_vue.replace('OMROJEN', 'DEJAMU')
with open('src/App.vue', 'w') as f:
    f.write(app_vue)

with open('README.md', 'r') as f:
    readme = f.read()
readme = readme.replace('OMROJEN - Sistem OMR SMPN 2 Kemranjen', 'DEJAMU - Detektor Jawaban Murid')
readme = readme.replace('OMROJEN (Sistem OMR SMPN 2 Kemranjen)', 'DEJAMU (Detektor Jawaban Murid)')
readme = readme.replace('OMROJEN', 'DEJAMU')
with open('README.md', 'w') as f:
    f.write(readme)

