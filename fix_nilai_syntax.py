import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

start_idx = content.find("const processKoreksi = async () => {")
end_idx = content.find("const openDialogDeleteSpecific = () => {")

clean_process_koreksi = """const processKoreksi = async () => {
  isKoreksi.value = true;
  try {
    const keyRecord = scanHistoryList.value.find(res => getUniqueId(res) === kunciId.value);
    if (!keyRecord) throw new Error("Kunci jawaban tidak ditemukan.");

    const keyAnswers = keyRecord.answers;
    
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
      let totalScore = 0;
      let totalQuestions = 0;
      let itemScores: { [key: number]: number } = {};
      
      for (const keyAns of keyAnswers) {
        if (keyAns.bentuk_soal === 'skala' || keyAns.bentuk_soal === 'likert') continue;
        
        totalQuestions++;
        let itemScore = 0;
        
        const userAns = res.answers.find((a: any) => a.nomor_soal === keyAns.nomor_soal);
        if (!userAns) {
          itemScores[keyAns.nomor_soal] = 0;
          continue;
        }
        
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
          // Compare strings directly, ignoring whitespace. If answer is '-', it's wrong.
          const userVal = String(userAns.jawaban || '').trim();
          const keyVal = String(keyAns.jawaban || '').trim();
          
          if (userVal === keyVal && keyVal !== '-' && keyVal !== '') {
            itemScore = 1;
          }
        }
        
        itemScores[keyAns.nomor_soal] = itemScore;
        totalScore += itemScore;
      }
      
      let nilai = 0;
      if (totalQuestions > 0) {
        nilai = Number(((totalScore / totalQuestions) * 100).toFixed(2));
      }
      
      await db.scoreResults.put({
        npsn: res.npsn,
        id_mapel: res.id_mapel,
        kode_tes: res.kode_tes,
        nisn: res.nisn,
        nilai: nilai,
        itemScores: itemScores,
        scoredAt: Date.now()
      });
    }
    
    omrStore.showToast('Koreksi data berhasil', 'success');
    dialogKoreksi.value = false;
    await loadHistory();
  } catch (e: any) {
    omrStore.showToast('Koreksi gagal: ' + e.message, 'error');
  } finally {
    isKoreksi.value = false;
  }
};

"""

content = content[:start_idx] + clean_process_koreksi + content[end_idx:]

with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

