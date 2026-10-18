/* Nagori · données du calendrier
   Les 24 sekki (二十四節気) et les 72 kō (七十二候, version du 略本暦 de 1874, celle en usage aujourd'hui).

   Noms japonais : domaine public. Lectures : celles de Wikipédia japonais (elles varient selon les sources),
   à faire relire par un natif. « sens » des kō : traduction littérale de travail, à vérifier par Arsène.
   « texte » : le petit texte du kō dans le jeu. Vide tant qu'Arsène ne l'a pas écrit (charte).

   Les dates ne sont pas stockées ici : elles se calculent depuis la position du soleil (js/ciel.js).
   Seule exception, les heures officielles de l'Observatoire national du Japon (NAOJ) ci-dessous,
   prioritaires quand elles existent. */
window.NAGORI = window.NAGORI || {};

/* [kanji, romaji, sens] ; index 0 = 立春, longitude du soleil 315° */
NAGORI.SEKKI = [
  ['立春', 'Risshun', 'Début du printemps'], ['雨水', 'Usui', 'Eau de pluie'], ['啓蟄', 'Keichitsu', 'Réveil des insectes'],
  ['春分', 'Shunbun', 'Équinoxe de printemps'], ['清明', 'Seimei', 'Pur et clair'], ['穀雨', 'Kokuu', 'Pluie des céréales'],
  ['立夏', 'Rikka', "Début de l'été"], ['小満', 'Shōman', 'Petite plénitude'], ['芒種', 'Bōshu', 'Semis des grains'],
  ['夏至', 'Geshi', "Solstice d'été"], ['小暑', 'Shōsho', 'Petite chaleur'], ['大暑', 'Taisho', 'Grande chaleur'],
  ['立秋', 'Risshū', "Début de l'automne"], ['処暑', 'Shosho', 'Fin des chaleurs'], ['白露', 'Hakuro', 'Rosée blanche'],
  ['秋分', 'Shūbun', "Équinoxe d'automne"], ['寒露', 'Kanro', 'Rosée froide'], ['霜降', 'Sōkō', 'Descente du givre'],
  ['立冬', 'Rittō', "Début de l'hiver"], ['小雪', 'Shōsetsu', 'Petite neige'], ['大雪', 'Taisetsu', 'Grande neige'],
  ['冬至', 'Tōji', "Solstice d'hiver"], ['小寒', 'Shōkan', 'Petit froid'], ['大寒', 'Daikan', 'Grand froid']
];

/* [kanji, lecture en kana, romaji, sens littéral (à vérifier)] ; index 0 = 立春 初候, longitude 315°, puis +5° */
NAGORI.KO = [
  ['東風解凍', 'はるかぜこおりをとく', 'harukaze kōri o toku', "Le vent d'est fait fondre la glace"],
  ['黄鶯睍睆', 'うぐいすなく', 'uguisu naku', 'La bouscarle chante'],
  ['魚上氷', 'うおこおりをいずる', 'uo kōri o izuru', 'Les poissons sortent de sous la glace'],
  ['土脉潤起', 'つちのしょううるおいおこる', 'tsuchi no shō uruoi okoru', "La terre s'humidifie"],
  ['霞始靆', 'かすみはじめてたなびく', 'kasumi hajimete tanabiku', "La brume commence à s'étirer"],
  ['草木萌動', 'そうもくめばえいずる', 'sōmoku mebae izuru', 'Les plantes bourgeonnent'],
  ['蟄虫啓戸', 'すごもりむしとをひらく', 'sugomori mushi to o hiraku', 'Les insectes ouvrent leur porte'],
  ['桃始笑', 'ももはじめてさく', 'momo hajimete saku', 'Les pêchers commencent à fleurir'],
  ['菜虫化蝶', 'なむしちょうとなる', 'namushi chō to naru', 'Les chenilles deviennent papillons'],
  ['雀始巣', 'すずめはじめてすくう', 'suzume hajimete sukuu', 'Les moineaux font leur nid'],
  ['櫻始開', 'さくらはじめてひらく', 'sakura hajimete hiraku', 'Les cerisiers commencent à fleurir'],
  ['雷乃発声', 'かみなりすなわちこえをはっす', 'kaminari sunawachi koe o hassu', 'Le tonnerre élève la voix'],
  ['玄鳥至', 'つばめきたる', 'tsubame kitaru', 'Les hirondelles arrivent'],
  ['鴻雁北', 'こうがんきたへかえる', 'kōgan kita e kaeru', 'Les oies sauvages repartent au nord'],
  ['虹始見', 'にじはじめてあらわる', 'niji hajimete arawaru', 'Les premiers arcs-en-ciel'],
  ['葭始生', 'あしはじめてしょうず', 'ashi hajimete shōzu', 'Les roseaux sortent de terre'],
  ['霜止出苗', 'しもやんでなえいづる', 'shimo yande nae izuru', 'Fin du givre, les semis lèvent'],
  ['牡丹華', 'ぼたんはなさく', 'botan hana saku', 'Les pivoines fleurissent'],
  ['蛙始鳴', 'かわずはじめてなく', 'kawazu hajimete naku', 'Les grenouilles commencent à chanter'],
  ['蚯蚓出', 'みみずいづる', 'mimizu izuru', 'Les vers de terre sortent'],
  ['竹笋生', 'たけのこしょうず', 'takenoko shōzu', 'Les pousses de bambou percent'],
  ['蚕起食桑', 'かいこおきてくわをはむ', 'kaiko okite kuwa o hamu', 'Les vers à soie mangent le mûrier'],
  ['紅花栄', 'べにばなさかう', 'benibana sakau', 'Les carthames sont en fleur'],
  ['麦秋至', 'むぎのときいたる', 'mugi no toki itaru', 'Le temps des blés arrive'],
  ['螳螂生', 'かまきりしょうず', 'kamakiri shōzu', 'Les mantes naissent'],
  ['腐草為螢', 'くされたるくさほたるとなる', 'kusaretaru kusa hotaru to naru', "L'herbe pourrie devient luciole"],
  ['梅子黄', 'うめのみきばむ', 'ume no mi kibamu', 'Les prunes jaunissent'],
  ['乃東枯', 'なつかれくさかるる', 'natsukarekusa karuru', 'La brunelle se fane'],
  ['菖蒲華', 'あやめはなさく', 'ayame hana saku', 'Les iris fleurissent'],
  ['半夏生', 'はんげしょうず', 'hange shōzu', 'Le pinellia pousse'],
  ['温風至', 'あつかぜいたる', 'atsukaze itaru', 'Le vent chaud arrive'],
  ['蓮始開', 'はすはじめてひらく', 'hasu hajimete hiraku', "Les lotus commencent à s'ouvrir"],
  ['鷹乃学習', 'たかすなわちわざをなす', 'taka sunawachi waza o nasu', 'Les jeunes faucons apprennent à voler'],
  ['桐始結花', 'きりはじめてはなをむすぶ', 'kiri hajimete hana o musubu', 'Le paulownia forme ses fleurs'],
  ['土潤溽暑', 'つちうるおうてむしあつし', 'tsuchi uruōte mushiatsushi', 'La terre est humide, la chaleur moite'],
  ['大雨時行', 'たいうときどきにふる', 'taiu tokidoki ni furu', 'De grosses pluies par moments'],
  ['涼風至', 'すづかぜいたる', 'suzukaze itaru', 'Le vent frais arrive'],
  ['寒蝉鳴', 'ひぐらしなく', 'higurashi naku', 'Les cigales higurashi chantent'],
  ['蒙霧升降', 'ふかききりまとう', 'fukaki kiri matou', 'Un brouillard épais enveloppe tout'],
  ['綿柎開', 'わたのはなしべひらく', 'wata no hanashibe hiraku', "Les capsules du coton s'ouvrent"],
  ['天地始粛', 'てんちはじめてさむし', 'tenchi hajimete samushi', 'La chaleur retombe enfin'],
  ['禾乃登', 'こくものすなわちみのる', 'kokumono sunawachi minoru', 'Le riz mûrit'],
  ['草露白', 'くさのつゆしろし', 'kusa no tsuyu shiroshi', "La rosée blanchit l'herbe"],
  ['鶺鴒鳴', 'せきれいなく', 'sekirei naku', 'Les bergeronnettes chantent'],
  ['玄鳥去', 'つばめさる', 'tsubame saru', "Les hirondelles s'en vont"],
  ['雷乃収声', 'かみなりすなわちこえをおさむ', 'kaminari sunawachi koe o osamu', 'Le tonnerre se tait'],
  ['蟄虫坏戸', 'むしかくれてとをふさぐ', 'mushi kakurete to o fusagu', 'Les insectes ferment leur porte'],
  ['水始涸', 'みずはじめてかる', 'mizu hajimete karu', 'On vide les rizières'],
  ['鴻雁来', 'こうがんきたる', 'kōgan kitaru', 'Les oies sauvages reviennent'],
  ['菊花開', 'きくのはなひらく', 'kiku no hana hiraku', 'Les chrysanthèmes fleurissent'],
  ['蟋蟀在戸', 'きりぎりすとにあり', 'kirigirisu to ni ari', 'Les grillons sont sur le seuil'],
  ['霜始降', 'しもはじめてふる', 'shimo hajimete furu', 'Les premières gelées blanches'],
  ['霎時施', 'こさめときどきふる', 'kosame tokidoki furu', 'Petites pluies par moments'],
  ['楓蔦黄', 'もみじつたきばむ', 'momiji tsuta kibamu', 'Les érables et le lierre rougissent'],
  ['山茶始開', 'つばきはじめてひらく', 'tsubaki hajimete hiraku', 'Les camélias commencent à fleurir'],
  ['地始凍', 'ちはじめてこおる', 'chi hajimete kōru', 'La terre commence à geler'],
  ['金盞香', 'きんせんかさく', 'kinsenka saku', 'Les narcisses fleurissent'],
  ['虹蔵不見', 'にじかくれてみえず', 'niji kakurete miezu', 'Les arcs-en-ciel se cachent'],
  ['朔風払葉', 'きたかぜこのはをはらう', 'kitakaze konoha o harau', 'Le vent du nord balaie les feuilles'],
  ['橘始黄', 'たちばなはじめてきばむ', 'tachibana hajimete kibamu', 'Les tachibana jaunissent'],
  ['閉塞成冬', 'そらさむくふゆとなる', 'sora samuku fuyu to naru', "Le ciel se ferme, c'est l'hiver"],
  ['熊蟄穴', 'くまあなにこもる', 'kuma ana ni komoru', 'Les ours se terrent'],
  ['鱖魚群', 'さけのうおむらがる', 'sake no uo muragaru', 'Les saumons remontent en bancs'],
  ['乃東生', 'なつかれくさしょうず', 'natsukarekusa shōzu', 'La brunelle repousse'],
  ['麋角解', 'おおしかのつのおつる', 'ōshika no tsuno otsuru', 'Les cerfs perdent leurs bois'],
  ['雪下出麦', 'ゆきわたりてむぎいづる', 'yuki watarite mugi izuru', 'Le blé pousse sous la neige'],
  ['芹乃栄', 'せりすなわちさかう', 'seri sunawachi sakau', "Le persil d'eau prospère"],
  ['水泉動', 'しみずあたたかをふくむ', 'shimizu atataka o fukumu', 'Les sources se réchauffent'],
  ['雉始雊', 'きじはじめてなく', 'kiji hajimete naku', 'Le faisan commence à crier'],
  ['款冬華', 'ふきのはなさく', 'fuki no hana saku', 'Les pétasites fleurissent'],
  ['水沢腹堅', 'さわみずこおりつめる', 'sawamizu kōri tsumeru', 'Les marais gèlent en profondeur'],
  ['鶏始乳', 'にわとりはじめてとやにつく', 'niwatori hajimete toya ni tsuku', 'Les poules commencent à couver']
];

/* Heures officielles (JST) des sekki, source : NAOJ, 暦要項 2026 et 2027.
   Format : année -> 24 dates « MM-JJ HH:MM » dans l'ordre 小寒, 大寒, 立春 … 冬至 (ordre du tableau NAOJ). */
NAGORI.SEKKI_OFFICIEL = {
  2026: ['01-05 17:23','01-20 10:45','02-04 05:02','02-19 00:52','03-05 22:59','03-20 23:46','04-05 03:40','04-20 10:39',
         '05-05 20:49','05-21 09:37','06-06 00:48','06-21 17:25','07-07 10:57','07-23 04:13','08-07 20:43','08-23 11:19',
         '09-07 23:41','09-23 09:05','10-08 15:29','10-23 18:38','11-07 18:52','11-22 16:23','12-07 11:53','12-22 05:50'],
  2027: ['01-05 23:10','01-20 16:30','02-04 10:46','02-19 06:33','03-06 04:40','03-21 05:25','04-05 09:17','04-20 16:18',
         '05-06 02:25','05-21 15:18','06-06 06:26','06-21 23:11','07-07 16:37','07-23 10:05','08-08 02:27','08-23 17:14',
         '09-08 05:28','09-23 15:02','10-08 21:17','10-24 00:33','11-08 00:39','11-22 22:16','12-07 17:38','12-22 11:42']
};

/* Textes des kō, écrits par Arsène. Clé : index du kō (0 à 71). Vide = pas encore écrit. */
NAGORI.KO_TEXTE = {};
