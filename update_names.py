import re

with open('src/views/Simulator.vue', 'r') as f:
    content = f.read()

# Generate a list of 600 names
names = [
    # Male
    "Budi Santoso", "Andi Pratama", "Eko Prasetyo", "Agus Setiawan", "Rizky Aditya",
    "Fajar Rahman", "Hendra Wijaya", "Ilham Akbar", "Joko Susilo", "Kevin Sanjaya",
    "Lukman Hakim", "Muhammad Irfan", "Naufal Rizqi", "Oki Setiawan", "Putra Pratama",
    "Rian Saputra", "Syahrul Gunawan", "Tegar Saputra", "Umar Faruq", "Wahyu Hidayat",
    "Yusuf Maulana", "Zainal Abidin", "Ahmad Fauzi", "Bima Sakti", "Candra Wijaya",
    "Deni Saputra", "Erwan Saputra", "Ferry Irawan", "Gilang Ramadhan", "Haryanto",
    "Ivan Gunawan", "Julius Caesar", "Kiki Saputra", "Leo Saputra", "Miko Prawira",
    "Nico Ardian", "Oscar Hidayat", "Pramoedya Ananta", "Reza Rahadian", "Surya Saputra",
    "Tito Karnavian", "Ucok Baba", "Vicky Prasetyo", "Willy Kurniawan", "Xaverius",
    "Yoga Pratama", "Zacky Mirza", "Aditya Nugraha", "Bayu Skak", "Chico Jericho",
    "Dimas Anggara", "Egi Melgiansyah", "Fadil Jaidi", "Gading Marten", "Hasan Sadikin",
    "Indra Sjafri", "Junaedi", "Kaesang Pangarep", "Lutfi Agizal", "Marcelino Lefrandt",
    "Nabil Husein", "Onadio Leonardo", "Panji Pragiwaksono", "Qibil", "Raffi Ahmad",
    "Sule", "Tukul Arwana", "Uus", "Vidi Aldiano", "Wendi Cagur", "Yayan Ruhian",
    "Zumi Zola", "Bambang Pamungkas", "Boaz Solossa", "Cristian Gonzales", "Evan Dimas",
    "Irfan Bachdim", "Makan Konate", "Stefano Lilipaly", "Andritany Ardhiyasa", "Ryuji Utomo",
    "Fachrudin Aryanto", "Ricky Fajrin", "Gavin Kwan", "Asnawi Mangkualam", "Saddil Ramdani",
    "Septian David", "Egy Maulana", "Witan Sulaeman", "Nadeo Argawinata", "Syahrian Abimanyu",
    "Rachmat Irianto", "Pratama Arhan", "Rizky Ridho", "Elkan Baggott", "Marc Klok",
    # Female
    "Siti Aminah", "Sri Wahyuni", "Ayu Lestari", "Rina Marlina", "Dewi Sartika",
    "Fitriani", "Nita Talia", "Lina Marlina", "Ratih Purwasih", "Susi Susanti",
    "Tuti Handayani", "Vina Panduwinata", "Wulan Guritno", "Yuni Shara", "Zara Leola",
    "Amanda Manopo", "Bunga Citra", "Chelsea Islan", "Dian Sastro", "Eva Celia",
    "Gita Gutawa", "Isyana Sarasvati", "Jessica Iskandar", "Raisa Andriana", "Maudy Ayunda",
    "Nia Ramadhani", "Olla Ramlan", "Prilly Latuconsina", "Syahrini", "Tiara Andini",
    "Via Vallen", "Zaskia Sungkar", "Zaskia Gotik", "Aura Kasih", "Cita Citata",
    "Dewi Perssik", "Inul Daratista", "Ayu Ting Ting", "Siti Badriah", "Nella Kharisma",
    "Lesti Kejora", "Mutia Ayu", "Marion Jola", "Brisia Jodie", "Lyodra Ginting",
    "Mahalini", "Ziva Magnolya", "Keisya Levronka", "Anneth Delliecia", "Nadin Amizah",
    "Yura Yunita", "Danilla Riyadi", "Nissa Sabyan", "Sulis", "Opick", 
    "Agnez Mo", "Anggun C Sasmi", "Rosa", "Krisdayanti", "Titi DJ",
    "Ruth Sahanaya", "Melly Goeslaw", "Titi Kamal", "Luna Maya", "Sophia Latjuba",
    "Cinta Laura", "Mikha Tambayong", "Pevita Pearce", "Tara Basro", "Adhisty Zara",
    "Anya Geraldine", "Rachel Vennya", "Awkarin", "Fuji An", "Fadly Faisal"
]

# We will add 300 males and 300 females dynamically inside the python script to make it 600
first_names_m = ["Aditya", "Budi", "Candra", "Deni", "Eko", "Fajar", "Gilang", "Hendra", "Irfan", "Joko", "Kevin", "Lukman", "Miko", "Naufal", "Oki", "Putra", "Rian", "Surya", "Tegar", "Yoga", "Andi", "Reza", "Fauzi", "Rizky", "Agus"]
last_names_m = ["Pratama", "Santoso", "Wijaya", "Saputra", "Hidayat", "Akbar", "Maulana", "Nugraha", "Kurniawan", "Setiawan", "Prasetyo", "Ramadhan", "Gunawan", "Susilo", "Hakim"]

first_names_f = ["Ayu", "Bunga", "Cinta", "Dewi", "Eka", "Fitri", "Gita", "Hani", "Indah", "Jessica", "Kartika", "Lestari", "Maya", "Nadia", "Olla", "Putri", "Rina", "Siti", "Tiara", "Vina", "Wulan", "Yuni", "Zaskia", "Ratih", "Sri"]
last_names_f = ["Sari", "Lestari", "Wahyuni", "Marlina", "Susanti", "Handayani", "Andriana", "Ayunda", "Ramadhani", "Sungkar", "Sarasvati", "Gutawa", "Islan", "Sastro", "Celia"]

more_names = []
for f in first_names_m:
    for l in last_names_m:
        more_names.append(f"{f} {l}")

for f in first_names_f:
    for l in last_names_f:
        more_names.append(f"{f} {l}")

all_names = list(set(names + more_names))
names_str = ",\n  ".join([f'"{n}"' for n in all_names])

pattern = r"const banyumasNames = \[.*?\];"
replacement = f"const banyumasNames = [\n  {names_str}\n];"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/views/Simulator.vue', 'w') as f:
    f.write(content)

