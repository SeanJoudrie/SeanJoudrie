/**
 * Codex excerpt — the EUROPE section, ripped in the product's shape: every
 * country opens into its subdivisions and a flag-history timeline with the
 * actual flags. Historical flag images resolve from Wikimedia Commons
 * (every URL verified at build time); current flags from flagcdn.
 * The full production codex covers 197 countries and 4,000+ entries.
 */
export type FlagEra = { name: string; era: string; img: string }
export type CodexEntry = {
  name: string
  code: string
  capital: string
  subdiv: string
  history: FlagEra[]
}

export const europe: CodexEntry[] = [
  {
    name: 'Albania',
    code: 'al',
    capital: 'Tirana',
    subdiv: '12 counties',
    history: [
      { name: 'Principality of Albania', era: '1914–1920', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Flag_of_Albania_%281914%E2%80%931920%29.svg/120px-Flag_of_Albania_%281914%E2%80%931920%29.svg.png' },
      { name: 'Kingdom under Zog I', era: '1934–1939', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Albania_%281934%E2%80%931939%29.svg/120px-Flag_of_Albania_%281934%E2%80%931939%29.svg.png' },
      { name: 'People\'s Republic — star above the eagle', era: '1946–1992', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Flag_of_Albania_%281946%E2%80%931992%29.svg/120px-Flag_of_Albania_%281946%E2%80%931992%29.svg.png' },
      { name: 'Plain double-headed eagle restored', era: '1992–', img: 'https://flagcdn.com/w80/al.png' },
    ],
  },
  {
    name: 'Andorra',
    code: 'ad',
    capital: 'Andorra la Vella',
    subdiv: '7 parishes',
    history: [
      { name: 'Bicolour before the tricolour', era: '1806–1866', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Flag_of_Andorra_%281806%E2%80%931866%29.svg/120px-Flag_of_Andorra_%281806%E2%80%931866%29.svg.png' },
      { name: 'Tricolour with arms; design standardized 1996', era: '1866–', img: 'https://flagcdn.com/w80/ad.png' },
    ],
  },
  {
    name: 'Austria',
    code: 'at',
    capital: 'Vienna',
    subdiv: '9 federal states',
    history: [
      { name: 'Habsburg black-gold', era: 'until 1918', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Flag_of_the_Habsburg_Monarchy.svg/120px-Flag_of_the_Habsburg_Monarchy.svg.png' },
      { name: 'Red-white-red (Babenberg bands) readopted', era: '1918–', img: 'https://flagcdn.com/w80/at.png' },
    ],
  },
  {
    name: 'Belarus',
    code: 'by',
    capital: 'Minsk',
    subdiv: '6 regions',
    history: [
      { name: 'White-red-white', era: '1918 · 1991–1995', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Flag_of_Belarus_%281918%2C_1991%E2%80%931995%29.svg/120px-Flag_of_Belarus_%281918%2C_1991%E2%80%931995%29.svg.png' },
      { name: 'Byelorussian SSR', era: '1951–1991', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Flag_of_the_Byelorussian_Soviet_Socialist_Republic_%281951%E2%80%931991%29.svg/120px-Flag_of_the_Byelorussian_Soviet_Socialist_Republic_%281951%E2%80%931991%29.svg.png' },
      { name: 'Soviet-derived design by referendum', era: '1995–', img: 'https://flagcdn.com/w80/by.png' },
    ],
  },
  {
    name: 'Belgium',
    code: 'be',
    capital: 'Brussels',
    subdiv: '3 regions · 10 provinces',
    history: [
      { name: 'Brabant Revolution colours', era: '1789–1790', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Flag_of_the_Brabantine_Revolution.svg/120px-Flag_of_the_Brabantine_Revolution.svg.png' },
      { name: 'Vertical tricolour adopted', era: '1831–', img: 'https://flagcdn.com/w80/be.png' },
    ],
  },
  {
    name: 'Bosnia and Herzegovina',
    code: 'ba',
    capital: 'Sarajevo',
    subdiv: '2 entities · 1 district',
    history: [
      { name: 'Fleur-de-lis republic flag', era: '1992–1998', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Bosnia_and_Herzegovina_%281992%E2%80%931998%29.svg/120px-Flag_of_Bosnia_and_Herzegovina_%281992%E2%80%931998%29.svg.png' },
      { name: 'Internationally brokered stars-and-triangle', era: '1998–', img: 'https://flagcdn.com/w80/ba.png' },
    ],
  },
  {
    name: 'Bulgaria',
    code: 'bg',
    capital: 'Sofia',
    subdiv: '28 provinces',
    history: [
      { name: 'State-emblem canton', era: '1971–1990', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Flag_of_Bulgaria_%281971%E2%80%931990%29.svg/120px-Flag_of_Bulgaria_%281971%E2%80%931990%29.svg.png' },
      { name: 'Plain tricolour restored', era: '1990–', img: 'https://flagcdn.com/w80/bg.png' },
    ],
  },
  {
    name: 'Croatia',
    code: 'hr',
    capital: 'Zagreb',
    subdiv: '20 counties + Zagreb',
    history: [
      { name: 'Socialist Republic — red star', era: '1946–1990', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Flag_of_Croatia_%281947%E2%80%931990%29.svg/120px-Flag_of_Croatia_%281947%E2%80%931990%29.svg.png' },
      { name: 'Šahovnica arms centred', era: '1990–', img: 'https://flagcdn.com/w80/hr.png' },
    ],
  },
  {
    name: 'Czechia',
    code: 'cz',
    capital: 'Prague',
    subdiv: '14 regions',
    history: [
      { name: 'Bohemian white-red', era: 'until 1920', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Flag_of_Bohemia.svg/120px-Flag_of_Bohemia.svg.png' },
      { name: 'Czechoslovak flag of 1920, retained by Czechia', era: '1920–', img: 'https://flagcdn.com/w80/cz.png' },
    ],
  },
  {
    name: 'Denmark',
    code: 'dk',
    capital: 'Copenhagen',
    subdiv: '5 regions',
    history: [
      { name: 'Dannebrog — legend dates it to a 1219 battle; the oldest national flag still in use', era: '1219–', img: 'https://flagcdn.com/w80/dk.png' },
    ],
  },
  {
    name: 'Estonia',
    code: 'ee',
    capital: 'Tallinn',
    subdiv: '15 counties',
    history: [
      { name: 'Estonian SSR — banned tricolour years', era: '1953–1990', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Flag_of_the_Estonian_Soviet_Socialist_Republic_%281953%E2%80%931990%29.svg/120px-Flag_of_the_Estonian_Soviet_Socialist_Republic_%281953%E2%80%931990%29.svg.png' },
      { name: 'Blue-black-white of 1918, restored', era: '1990–', img: 'https://flagcdn.com/w80/ee.png' },
    ],
  },
  {
    name: 'Finland',
    code: 'fi',
    capital: 'Helsinki',
    subdiv: '19 regions',
    history: [
      { name: 'Russian Grand Duchy era', era: 'until 1917', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Russia.svg/120px-Flag_of_Russia.svg.png' },
      { name: 'Blue cross on white adopted', era: '1918–', img: 'https://flagcdn.com/w80/fi.png' },
    ],
  },
  {
    name: 'France',
    code: 'fr',
    capital: 'Paris',
    subdiv: '18 regions',
    history: [
      { name: 'Royal standard — Bourbon fleur-de-lis', era: '1589–1790', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Royal_Standard_of_the_King_of_France.svg/120px-Royal_Standard_of_the_King_of_France.svg.png' },
      { name: 'First Tricolore of the Revolution', era: '1790–1794', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Flag_of_France_%281790%E2%80%931794%29.svg/120px-Flag_of_France_%281790%E2%80%931794%29.svg.png' },
      { name: 'Tricolore standardized', era: '1794–', img: 'https://flagcdn.com/w80/fr.png' },
    ],
  },
  {
    name: 'Germany',
    code: 'de',
    capital: 'Berlin',
    subdiv: '16 federal states',
    history: [
      { name: 'Imperial black-white-red', era: '1871–1918', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Flag_of_Germany_%281867%E2%80%931918%29.svg/120px-Flag_of_Germany_%281867%E2%80%931918%29.svg.png' },
      { name: 'Weimar black-red-gold', era: '1919–1933', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Germany_%283-2%29.svg/120px-Flag_of_Germany_%283-2%29.svg.png' },
      { name: 'East Germany — emblem added', era: '1959–1990', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Flag_of_East_Germany.svg/120px-Flag_of_East_Germany.svg.png' },
      { name: 'Federal tricolour', era: '1949–', img: 'https://flagcdn.com/w80/de.png' },
    ],
  },
  {
    name: 'Greece',
    code: 'gr',
    capital: 'Athens',
    subdiv: '13 regions',
    history: [
      { name: 'Plain cross land flag (alternating use)', era: '1822–1978', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Greece_%281822-1978%29.svg/120px-Flag_of_Greece_%281822-1978%29.svg.png' },
      { name: 'Nine-stripe sea flag made sole flag', era: '1978–', img: 'https://flagcdn.com/w80/gr.png' },
    ],
  },
  {
    name: 'Hungary',
    code: 'hu',
    capital: 'Budapest',
    subdiv: '19 counties',
    history: [
      { name: 'Rákosi badge — cut out during the 1956 uprising', era: '1949–1956', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Flag_of_Hungary_%281949-1956%29.svg/120px-Flag_of_Hungary_%281949-1956%29.svg.png' },
      { name: 'Kossuth arms restored briefly', era: '1946–49 · 1956–57', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Flag_of_Hungary_%281946-1949%2C_1956-1957%29.svg/120px-Flag_of_Hungary_%281946-1949%2C_1956-1957%29.svg.png' },
      { name: 'Plain tricolour', era: '1957–', img: 'https://flagcdn.com/w80/hu.png' },
    ],
  },
  {
    name: 'Iceland',
    code: 'is',
    capital: 'Reykjavík',
    subdiv: '64 municipalities',
    history: [
      { name: 'Danish Dannebrog era', era: 'until 1915', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Denmark.svg/120px-Flag_of_Denmark.svg.png' },
      { name: 'Cross flag; republic proclaimed 1944', era: '1918–', img: 'https://flagcdn.com/w80/is.png' },
    ],
  },
  {
    name: 'Ireland',
    code: 'ie',
    capital: 'Dublin',
    subdiv: '4 provinces · 26 counties',
    history: [
      { name: 'Green harp flag', era: '17th c.–1916', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Green_harp_flag_of_Ireland.svg/120px-Green_harp_flag_of_Ireland.svg.png' },
      { name: 'Tricolour (an 1848 design) adopted', era: '1919–', img: 'https://flagcdn.com/w80/ie.png' },
    ],
  },
  {
    name: 'Italy',
    code: 'it',
    capital: 'Rome',
    subdiv: '20 regions',
    history: [
      { name: 'Kingdom of Italy — Savoy arms', era: '1861–1946', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Flag_of_Italy_%281861%E2%80%931946%29.svg/120px-Flag_of_Italy_%281861%E2%80%931946%29.svg.png' },
      { name: 'Republican tricolore', era: '1946–', img: 'https://flagcdn.com/w80/it.png' },
    ],
  },
  {
    name: 'Kosovo',
    code: 'xk',
    capital: 'Pristina',
    subdiv: '7 districts',
    history: [
      { name: 'Map and six stars, adopted at independence', era: '2008–', img: 'https://flagcdn.com/w80/xk.png' },
    ],
  },
  {
    name: 'Latvia',
    code: 'lv',
    capital: 'Riga',
    subdiv: '43 municipalities',
    history: [
      { name: 'Latvian SSR — carmine-white banned', era: '1953–1990', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_Latvian_Soviet_Socialist_Republic_%281953%E2%80%931990%29.svg/120px-Flag_of_the_Latvian_Soviet_Socialist_Republic_%281953%E2%80%931990%29.svg.png' },
      { name: 'Attested 1280; readopted 1918, restored', era: '1990–', img: 'https://flagcdn.com/w80/lv.png' },
    ],
  },
  {
    name: 'Liechtenstein',
    code: 'li',
    capital: 'Vaduz',
    subdiv: '11 municipalities',
    history: [
      { name: 'Before the crown', era: '1921–1937', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Flag_of_Liechtenstein_%281921%E2%80%931937%29.svg/120px-Flag_of_Liechtenstein_%281921%E2%80%931937%29.svg.png' },
      { name: 'Crown added after the 1936 Olympics revealed Haiti\'s identical flag', era: '1937–', img: 'https://flagcdn.com/w80/li.png' },
    ],
  },
  {
    name: 'Lithuania',
    code: 'lt',
    capital: 'Vilnius',
    subdiv: '10 counties',
    history: [
      { name: 'Lithuanian SSR — tricolour banned', era: '1953–1988', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_the_Lithuanian_Soviet_Socialist_Republic_%281953%E2%80%931988%29.svg/120px-Flag_of_the_Lithuanian_Soviet_Socialist_Republic_%281953%E2%80%931988%29.svg.png' },
      { name: 'Tricolour of 1918, restored', era: '1989–', img: 'https://flagcdn.com/w80/lt.png' },
    ],
  },
  {
    name: 'Luxembourg',
    code: 'lu',
    capital: 'Luxembourg',
    subdiv: '12 cantons',
    history: [
      { name: 'Lighter blue distinguishes it from the Dutch flag; standardized', era: '1972–', img: 'https://flagcdn.com/w80/lu.png' },
    ],
  },
  {
    name: 'Malta',
    code: 'mt',
    capital: 'Valletta',
    subdiv: '68 local councils',
    history: [
      { name: 'Colonial flag with the George Cross', era: '1943–1964', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Malta_%281943%E2%80%931964%29.svg/120px-Flag_of_Malta_%281943%E2%80%931964%29.svg.png' },
      { name: 'George Cross retained at independence', era: '1964–', img: 'https://flagcdn.com/w80/mt.png' },
    ],
  },
  {
    name: 'Moldova',
    code: 'md',
    capital: 'Chișinău',
    subdiv: '32 districts',
    history: [
      { name: 'Moldavian SSR banner', era: '1952–1990', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Flag_of_the_Moldavian_Soviet_Socialist_Republic_%281952%E2%80%931990%29.svg/120px-Flag_of_the_Moldavian_Soviet_Socialist_Republic_%281952%E2%80%931990%29.svg.png' },
      { name: 'Tricolour with arms', era: '1990–', img: 'https://flagcdn.com/w80/md.png' },
    ],
  },
  {
    name: 'Monaco',
    code: 'mc',
    capital: 'Monaco',
    subdiv: '4 quarters',
    history: [
      { name: 'Indonesia\'s twin — only the ratio differs', era: 'cf.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_Indonesia.svg/120px-Flag_of_Indonesia.svg.png' },
      { name: 'Red-white bicolour', era: '1881–', img: 'https://flagcdn.com/w80/mc.png' },
    ],
  },
  {
    name: 'Montenegro',
    code: 'me',
    capital: 'Podgorica',
    subdiv: '24 municipalities',
    history: [
      { name: 'Socialist Republic — red star', era: '1946–1992', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Flag_of_Montenegro_%281946%E2%80%931993%29%2C_Flag_of_Serbia_%281947%E2%80%931992%29.svg/120px-Flag_of_Montenegro_%281946%E2%80%931993%29%2C_Flag_of_Serbia_%281947%E2%80%931992%29.svg.png' },
      { name: 'Plain tricolour years', era: '1993–2004', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Flag_of_Montenegro_%281993%E2%80%932004%29.svg/120px-Flag_of_Montenegro_%281993%E2%80%932004%29.svg.png' },
      { name: 'Red field with golden arms', era: '2004–', img: 'https://flagcdn.com/w80/me.png' },
    ],
  },
  {
    name: 'Netherlands',
    code: 'nl',
    capital: 'Amsterdam',
    subdiv: '12 provinces',
    history: [
      { name: 'Prince\'s Flag — orange band', era: '1572–c.1660', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Prinsenvlag.svg/120px-Prinsenvlag.svg.png' },
      { name: 'Red-white-blue statenvlag', era: 'c.1660–', img: 'https://flagcdn.com/w80/nl.png' },
    ],
  },
  {
    name: 'North Macedonia',
    code: 'mk',
    capital: 'Skopje',
    subdiv: '8 regions',
    history: [
      { name: 'Vergina Sun flag', era: '1992–1995', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Flag_of_Macedonia_%281992%E2%80%931995%29.svg/120px-Flag_of_Macedonia_%281992%E2%80%931995%29.svg.png' },
      { name: 'Stylized sun after the Greek dispute', era: '1995–', img: 'https://flagcdn.com/w80/mk.png' },
    ],
  },
  {
    name: 'Norway',
    code: 'no',
    capital: 'Oslo',
    subdiv: '15 counties',
    history: [
      { name: 'Union badge — the “herring salad”', era: '1844–1899', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Norge-Unionsflagg-1844.svg/120px-Norge-Unionsflagg-1844.svg.png' },
      { name: 'Pure cross flag', era: '1899–', img: 'https://flagcdn.com/w80/no.png' },
    ],
  },
  {
    name: 'Poland',
    code: 'pl',
    capital: 'Warsaw',
    subdiv: '16 voivodeships',
    history: [
      { name: 'State flag variant with the crowned eagle', era: '1919–', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Flag_of_Poland_%28with_coat_of_arms%29.svg/120px-Flag_of_Poland_%28with_coat_of_arms%29.svg.png' },
      { name: 'White-red civil flag, unchanged through the PRL era', era: '1919–', img: 'https://flagcdn.com/w80/pl.png' },
    ],
  },
  {
    name: 'Portugal',
    code: 'pt',
    capital: 'Lisbon',
    subdiv: '18 districts',
    history: [
      { name: 'Blue-white monarchy flag', era: '1830–1910', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Flag_of_Portugal_%281830%E2%80%931910%29.svg/120px-Flag_of_Portugal_%281830%E2%80%931910%29.svg.png' },
      { name: 'Republican green-red with the armillary sphere', era: '1911–', img: 'https://flagcdn.com/w80/pt.png' },
    ],
  },
  {
    name: 'Romania',
    code: 'ro',
    capital: 'Bucharest',
    subdiv: '41 counties',
    history: [
      { name: 'Socialist arms — cut out during the Revolution', era: '1965–1989', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_Romania_%281965%E2%80%931989%29.svg/120px-Flag_of_Romania_%281965%E2%80%931989%29.svg.png' },
      { name: 'Plain tricolour', era: '1989–', img: 'https://flagcdn.com/w80/ro.png' },
    ],
  },
  {
    name: 'Russia',
    code: 'ru',
    capital: 'Moscow',
    subdiv: '46 oblasts · 2 federal cities',
    history: [
      { name: 'Soviet red banner', era: '1922–1991', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flag_of_the_Soviet_Union.svg/120px-Flag_of_the_Soviet_Union.svg.png' },
      { name: 'Russian SFSR', era: '1954–1991', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Flag_of_the_Russian_Soviet_Federative_Socialist_Republic_%281954%E2%80%931991%29.svg/120px-Flag_of_the_Russian_Soviet_Federative_Socialist_Republic_%281954%E2%80%931991%29.svg.png' },
      { name: 'Tsarist merchant tricolour of 1696, restored', era: '1991–', img: 'https://flagcdn.com/w80/ru.png' },
    ],
  },
  {
    name: 'San Marino',
    code: 'sm',
    capital: 'San Marino',
    subdiv: '9 castelli',
    history: [
      { name: 'White-blue with arms; design standardized 2011', era: '1862–', img: 'https://flagcdn.com/w80/sm.png' },
    ],
  },
  {
    name: 'Serbia',
    code: 'rs',
    capital: 'Belgrade',
    subdiv: '29 districts',
    history: [
      { name: 'Socialist Republic — red star', era: '1946–1992', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Flag_of_Montenegro_%281946%E2%80%931993%29%2C_Flag_of_Serbia_%281947%E2%80%931992%29.svg/120px-Flag_of_Montenegro_%281946%E2%80%931993%29%2C_Flag_of_Serbia_%281947%E2%80%931992%29.svg.png' },
      { name: 'FR Yugoslavia plain tricolour', era: '1992–2004', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Flag_of_Serbia_and_Montenegro_%281992%E2%80%932006%29.svg/120px-Flag_of_Serbia_and_Montenegro_%281992%E2%80%932006%29.svg.png' },
      { name: 'Arms added to the tricolour', era: '2004–', img: 'https://flagcdn.com/w80/rs.png' },
    ],
  },
  {
    name: 'Slovakia',
    code: 'sk',
    capital: 'Bratislava',
    subdiv: '8 regions',
    history: [
      { name: 'Under the Czechoslovak flag', era: '1920–1992', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_Czech_Republic.svg/120px-Flag_of_the_Czech_Republic.svg.png' },
      { name: 'Pan-Slavic tricolour with arms added at independence', era: '1992–', img: 'https://flagcdn.com/w80/sk.png' },
    ],
  },
  {
    name: 'Slovenia',
    code: 'si',
    capital: 'Ljubljana',
    subdiv: '212 municipalities',
    history: [
      { name: 'Socialist Republic — red star', era: '1946–1991', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Flag_of_Slovenia_%281945%E2%80%931991%29.svg/120px-Flag_of_Slovenia_%281945%E2%80%931991%29.svg.png' },
      { name: 'Triglav arms', era: '1991–', img: 'https://flagcdn.com/w80/si.png' },
    ],
  },
  {
    name: 'Spain',
    code: 'es',
    capital: 'Madrid',
    subdiv: '17 autonomous communities',
    history: [
      { name: 'Second Republic tricolour', era: '1931–1939', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Flag_of_Spain_%281931%E2%80%931939%29.svg/120px-Flag_of_Spain_%281931%E2%80%931939%29.svg.png' },
      { name: 'Francoist eagle', era: '1945–1977', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Flag_of_Spain_%281945%E2%80%931977%29.svg/120px-Flag_of_Spain_%281945%E2%80%931977%29.svg.png' },
      { name: 'Current arms', era: '1981–', img: 'https://flagcdn.com/w80/es.png' },
    ],
  },
  {
    name: 'Sweden',
    code: 'se',
    capital: 'Stockholm',
    subdiv: '21 counties',
    history: [
      { name: 'Union mark with Norway', era: '1844–1905', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Swedish_civil_ensign_%281844%E2%80%931905%29.svg/120px-Swedish_civil_ensign_%281844%E2%80%931905%29.svg.png' },
      { name: 'Current flag law', era: '1906–', img: 'https://flagcdn.com/w80/se.png' },
    ],
  },
  {
    name: 'Switzerland',
    code: 'ch',
    capital: 'Bern',
    subdiv: '26 cantons',
    history: [
      { name: 'Federal white cross — one of two square national flags', era: '1848–', img: 'https://flagcdn.com/w80/ch.png' },
    ],
  },
  {
    name: 'Ukraine',
    code: 'ua',
    capital: 'Kyiv',
    subdiv: '24 oblasts',
    history: [
      { name: 'Ukrainian SSR red-azure', era: '1949–1991', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_the_Ukrainian_Soviet_Socialist_Republic_%281949%E2%80%931991%29.svg/120px-Flag_of_the_Ukrainian_Soviet_Socialist_Republic_%281949%E2%80%931991%29.svg.png' },
      { name: 'Blue-gold of the 1918 republic, restored', era: '1992–', img: 'https://flagcdn.com/w80/ua.png' },
    ],
  },
  {
    name: 'United Kingdom',
    code: 'gb',
    capital: 'London',
    subdiv: '4 constituent countries',
    history: [
      { name: 'First Union Flag — no St Patrick\'s saltire', era: '1707–1801', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Flag_of_Great_Britain_%281707%E2%80%931800%29.svg/120px-Flag_of_Great_Britain_%281707%E2%80%931800%29.svg.png' },
      { name: 'Union Jack', era: '1801–', img: 'https://flagcdn.com/w80/gb.png' },
    ],
  },
  {
    name: 'Vatican City',
    code: 'va',
    capital: 'Vatican City',
    subdiv: 'City-state',
    history: [
      { name: 'Keys and tiara — square flag of the Lateran Treaty', era: '1929–', img: 'https://flagcdn.com/w80/va.png' },
    ],
  },
]

export const CODEX_TOTALS = { countries: 197, europe: europe.length, entries: '4,000+' }
