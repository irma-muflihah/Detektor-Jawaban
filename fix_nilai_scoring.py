import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

# Fix the scoring logic: filter targets
old_logic = """
    // Process all scans
    for (const res of scanHistoryList.value) {
"""

new_logic = """
    // Process only scans with matching npsn, id_mapel, and kode_tes
    const targets = scanHistoryList.value.filter(res => 
      res.npsn === keyRecord.npsn && 
      res.id_mapel === keyRecord.id_mapel && 
      res.kode_tes === keyRecord.kode_tes
    );

    if (targets.length === 0) {
      omrStore.showToast("Tidak ada data yang cocok dengan kunci ini.", "warning");
      isKoreksi.value = false;
      return;
    }

    for (const res of targets) {
"""

content = content.replace(old_logic.strip(), new_logic.strip())

# Make the scoring condition more robust, just in case `bentuk_soal` values are weird
# Let's just say: if it's NOT kompleks, compare strings.
old_scoring = """
        if (['biasa', 'mcq_standard', 'bs', 'true_false', 'sts', 'agree_disagree', 'jodoh', 'matching'].includes(keyAns.bentuk_soal)) {
          if (userAns.jawaban === keyAns.jawaban) {
            itemScore = 1;
          }
        } else if (keyAns.bentuk_soal === 'kompleks' || keyAns.bentuk_soal === 'mcq_complex') {
"""

new_scoring = """
        if (keyAns.bentuk_soal === 'kompleks' || keyAns.bentuk_soal === 'mcq_complex') {
          const userArr = Array.isArray(userAns.jawaban) ? userAns.jawaban : [];
          const keyArr = Array.isArray(keyAns.jawaban) ? keyAns.jawaban : [];
          
          if (mcqComplexMode.value === 'strict') {
            if (userArr.length === keyArr.length && userArr.every((v: string) => keyArr.includes(v))) {
              itemScore = 1;
            }
          } else if (mcqComplexMode.value === 'loose') {
            if (keyArr.length > 0) {
              const correctChosen = userArr.filter((v: string) => keyArr.includes(v)).length;
              const wrongChosen = userArr.filter((v: string) => !keyArr.includes(v)).length;
              itemScore = Math.max(0, (correctChosen - wrongChosen) / keyArr.length);
            }
          }
        } else {
          // Standard exact match for 'biasa', 'bs', 'sts', 'jodoh', etc.
          if (String(userAns.jawaban).trim() === String(keyAns.jawaban).trim()) {
            itemScore = 1;
          }
        }
"""

content = content.replace(old_scoring.strip(), new_scoring.strip())

# Also remove the closing of the old else if
content = content.replace("          } else if (mcqComplexMode.value === 'loose') {\n            if (keyArr.length > 0) {\n              const correctChosen = userArr.filter((v: string) => keyArr.includes(v)).length;\n              const wrongChosen = userArr.filter((v: string) => !keyArr.includes(v)).length;\n              itemScore = Math.max(0, (correctChosen - wrongChosen) / keyArr.length);\n            }\n          }\n        }", "          } else if (mcqComplexMode.value === 'loose') {\n            if (keyArr.length > 0) {\n              const correctChosen = userArr.filter((v: string) => keyArr.includes(v)).length;\n              const wrongChosen = userArr.filter((v: string) => !keyArr.includes(v)).length;\n              itemScore = Math.max(0, (correctChosen - wrongChosen) / keyArr.length);\n            }\n          }\n        } else {\n          if (String(userAns.jawaban).trim() === String(keyAns.jawaban).trim() && String(keyAns.jawaban).trim() !== '-') {\n            itemScore = 1;\n          }\n        }")

# Re-write the whole block securely to avoid mismatch
old_full_scoring = """        if (['biasa', 'mcq_standard', 'bs', 'true_false', 'sts', 'agree_disagree', 'jodoh', 'matching'].includes(keyAns.bentuk_soal)) {
          if (userAns.jawaban === keyAns.jawaban) {
            itemScore = 1;
          }
        } else if (keyAns.bentuk_soal === 'kompleks' || keyAns.bentuk_soal === 'mcq_complex') {
          const userArr = Array.isArray(userAns.jawaban) ? userAns.jawaban : [];
          const keyArr = Array.isArray(keyAns.jawaban) ? keyAns.jawaban : [];
          
          if (mcqComplexMode.value === 'strict') {
            if (userArr.length === keyArr.length && userArr.every((v: string) => keyArr.includes(v))) {
              itemScore = 1;
            }
          } else if (mcqComplexMode.value === 'loose') {
            if (keyArr.length > 0) {
              const correctChosen = userArr.filter((v: string) => keyArr.includes(v)).length;
              const wrongChosen = userArr.filter((v: string) => !keyArr.includes(v)).length;
              itemScore = Math.max(0, (correctChosen - wrongChosen) / keyArr.length);
            }
          }
        }"""

new_full_scoring = """        if (keyAns.bentuk_soal === 'kompleks' || keyAns.bentuk_soal === 'mcq_complex') {
          const userArr = Array.isArray(userAns.jawaban) ? userAns.jawaban : [];
          const keyArr = Array.isArray(keyAns.jawaban) ? keyAns.jawaban : [];
          
          if (mcqComplexMode.value === 'strict') {
            if (userArr.length === keyArr.length && userArr.every((v: string) => keyArr.includes(v))) {
              itemScore = 1;
            }
          } else if (mcqComplexMode.value === 'loose') {
            if (keyArr.length > 0) {
              const correctChosen = userArr.filter((v: string) => keyArr.includes(v)).length;
              const wrongChosen = userArr.filter((v: string) => !keyArr.includes(v)).length;
              itemScore = Math.max(0, (correctChosen - wrongChosen) / keyArr.length);
            }
          }
        } else {
          // Compare strings directly, ignoring whitespace. If answer is '-', it's wrong.
          const userVal = String(userAns.jawaban || '').trim();
          const keyVal = String(keyAns.jawaban || '').trim();
          
          if (userVal === keyVal && keyVal !== '-' && keyVal !== '') {
            itemScore = 1;
          }
        }"""

content = content.replace(old_full_scoring, new_full_scoring)


with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

