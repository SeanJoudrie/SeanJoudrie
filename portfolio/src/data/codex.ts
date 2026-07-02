/**
 * Codex excerpt — the EUROPE section, in the shape the production codex
 * uses: every country carries its capital, subdivisions, and a flag-history
 * timeline. The full codex covers all 197 countries and 4,000+ entries
 * across historical, subdivision, and language layers; this is one region,
 * as a taste.
 *
 * History entries are deliberately trimmed to the 1–3 most telling eras.
 */
export type FlagEra = { name: string; era: string }
export type CodexEntry = {
  name: string
  code: string
  capital: string
  subdiv: string
  history: FlagEra[]
}

const e = (
  name: string,
  code: string,
  capital: string,
  subdiv: string,
  history: FlagEra[],
): CodexEntry => ({ name, code, capital, subdiv, history })

export const europe: CodexEntry[] = [
  e('Albania', 'al', 'Tirana', '12 counties', [
    { name: 'Communist star above the eagle', era: '1946–1992' },
    { name: 'Plain double-headed eagle restored', era: '1992–' },
  ]),
  e('Andorra', 'ad', 'Andorra la Vella', '7 parishes', [
    { name: 'Tricolour with arms, 19th-century origins', era: '1866–' },
    { name: 'Design standardized', era: '1996' },
  ]),
  e('Austria', 'at', 'Vienna', '9 federal states', [
    { name: 'Habsburg black-gold', era: 'until 1918' },
    { name: 'Red-white-red (Babenberg bands) readopted', era: '1918–' },
  ]),
  e('Belarus', 'by', 'Minsk', '6 regions', [
    { name: 'White-red-white', era: '1918 · 1991–1995' },
    { name: 'Soviet-derived design by referendum', era: '1995–' },
  ]),
  e('Belgium', 'be', 'Brussels', '3 regions · 10 provinces', [
    { name: 'Brabant Revolution colours', era: '1789' },
    { name: 'Vertical tricolour adopted', era: '1831–' },
  ]),
  e('Bosnia and Herzegovina', 'ba', 'Sarajevo', '2 entities · 1 district', [
    { name: 'Fleur-de-lis republic flag', era: '1992–1998' },
    { name: 'Internationally brokered stars-and-triangle', era: '1998–' },
  ]),
  e('Bulgaria', 'bg', 'Sofia', '28 provinces', [
    { name: 'State-emblem canton', era: '1948–1990' },
    { name: 'Plain tricolour restored', era: '1990–' },
  ]),
  e('Croatia', 'hr', 'Zagreb', '20 counties + Zagreb', [
    { name: 'Yugoslav tricolour with red star', era: '1946–1990' },
    { name: 'Šahovnica arms centred', era: '1990–' },
  ]),
  e('Czechia', 'cz', 'Prague', '14 regions', [
    { name: 'Czechoslovak flag adopted', era: '1920' },
    { name: 'Retained by the Czech Republic', era: '1993–' },
  ]),
  e('Denmark', 'dk', 'Copenhagen', '5 regions', [
    { name: 'Dannebrog — legend dates it to a 1219 battle', era: '1219' },
    { name: 'Oldest continuously used national flag', era: '–' },
  ]),
  e('Estonia', 'ee', 'Tallinn', '15 counties', [
    { name: 'Blue-black-white adopted', era: '1918' },
    { name: 'Banned under Soviet rule, restored', era: '1990–' },
  ]),
  e('Finland', 'fi', 'Helsinki', '19 regions', [
    { name: 'Russian Grand Duchy era', era: 'until 1917' },
    { name: 'Blue cross on white adopted', era: '1918–' },
  ]),
  e('France', 'fr', 'Paris', '18 regions', [
    { name: 'Royal standard, Bourbon fleur-de-lis', era: '1589–1790' },
    { name: 'First Tricolore of the Revolution', era: '1790–1794' },
    { name: 'Tricolore standardized', era: '1794–' },
  ]),
  e('Germany', 'de', 'Berlin', '16 federal states', [
    { name: 'Imperial black-white-red', era: '1871–1918' },
    { name: 'Weimar black-red-gold', era: '1919–1933' },
    { name: 'Federal tricolour readopted', era: '1949–' },
  ]),
  e('Greece', 'gr', 'Athens', '13 regions', [
    { name: 'Plain cross land flag (alternating use)', era: 'until 1978' },
    { name: 'Nine-stripe sea flag made sole flag', era: '1978–' },
  ]),
  e('Hungary', 'hu', 'Budapest', '19 counties', [
    { name: 'Rákosi badge — cut out during the 1956 uprising', era: '1949–1956' },
    { name: 'Plain tricolour', era: '1957–' },
  ]),
  e('Iceland', 'is', 'Reykjavík', '64 municipalities', [
    { name: 'Danish Dannebrog era', era: 'until 1915' },
    { name: 'Cross flag; republic proclaimed', era: '1918 · 1944–' },
  ]),
  e('Ireland', 'ie', 'Dublin', '4 provinces · 26 counties', [
    { name: 'Green harp flag', era: '17th c.–1916' },
    { name: 'Tricolour (an 1848 design) adopted', era: '1919–' },
  ]),
  e('Italy', 'it', 'Rome', '20 regions', [
    { name: 'Kingdom of Italy, Savoy arms', era: '1861–1946' },
    { name: 'Republican tricolore', era: '1946–' },
  ]),
  e('Kosovo', 'xk', 'Pristina', '7 districts', [
    { name: 'Map and six stars, adopted at independence', era: '2008–' },
  ]),
  e('Latvia', 'lv', 'Riga', '43 municipalities', [
    { name: 'Carmine-white attested in chronicle', era: '1280' },
    { name: 'Readopted, then restored after Soviet ban', era: '1918 · 1990–' },
  ]),
  e('Liechtenstein', 'li', 'Vaduz', '11 municipalities', [
    { name: 'Crown added after the 1936 Olympics revealed Haiti flew an identical flag', era: '1937–' },
  ]),
  e('Lithuania', 'lt', 'Vilnius', '10 counties', [
    { name: 'Tricolour adopted', era: '1918' },
    { name: 'Banned 1940–1988, restored', era: '1989–' },
  ]),
  e('Luxembourg', 'lu', 'Luxembourg', '12 cantons', [
    { name: 'Distinguished from the Dutch flag by its lighter blue', era: '1972–' },
  ]),
  e('Malta', 'mt', 'Valletta', '68 local councils', [
    { name: 'George Cross awarded and added', era: '1943' },
    { name: 'Retained at independence', era: '1964–' },
  ]),
  e('Moldova', 'md', 'Chișinău', '32 districts', [
    { name: 'Moldavian SSR banner', era: '1952–1990' },
    { name: 'Tricolour with arms', era: '1990–' },
  ]),
  e('Monaco', 'mc', 'Monaco', '4 quarters', [
    { name: 'Red-white bicolour — Indonesia’s twin, different ratio', era: '1881–' },
  ]),
  e('Montenegro', 'me', 'Podgorica', '24 municipalities', [
    { name: 'Yugoslav-era tricolour', era: '1946–2004' },
    { name: 'Red field with golden arms', era: '2004–' },
  ]),
  e('Netherlands', 'nl', 'Amsterdam', '12 provinces', [
    { name: 'Prince’s Flag, orange band', era: '1572–c.1660' },
    { name: 'Red-white-blue statenvlag', era: 'c.1660–' },
  ]),
  e('North Macedonia', 'mk', 'Skopje', '8 regions', [
    { name: 'Vergina Sun flag', era: '1992–1995' },
    { name: 'Stylized sun after the Greek dispute', era: '1995–' },
  ]),
  e('Norway', 'no', 'Oslo', '15 counties', [
    { name: 'Union badge — the “herring salad”', era: '1844–1899' },
    { name: 'Pure cross flag', era: '1899–' },
  ]),
  e('Poland', 'pl', 'Warsaw', '16 voivodeships', [
    { name: 'White-red confirmed by the Second Republic', era: '1919' },
    { name: 'Design unchanged through the PRL era', era: '1945–1989' },
  ]),
  e('Portugal', 'pt', 'Lisbon', '18 districts', [
    { name: 'Blue-white monarchy flag', era: 'until 1910' },
    { name: 'Republican green-red with sphere', era: '1911–' },
  ]),
  e('Romania', 'ro', 'Bucharest', '41 counties', [
    { name: 'Socialist arms — cut out during the Revolution', era: '1948–1989' },
    { name: 'Plain tricolour', era: '1989–' },
  ]),
  e('Russia', 'ru', 'Moscow', '46 oblasts · 2 federal cities', [
    { name: 'Tsarist merchant tricolour', era: '1696–1917' },
    { name: 'Soviet red banner', era: '1922–1991' },
    { name: 'Tricolour restored', era: '1991–' },
  ]),
  e('San Marino', 'sm', 'San Marino', '9 castelli', [
    { name: 'White-blue with arms', era: '1862–' },
    { name: 'Design standardized', era: '2011' },
  ]),
  e('Serbia', 'rs', 'Belgrade', '29 districts', [
    { name: 'Yugoslav tricolour with star', era: '1946–1992' },
    { name: 'Arms added to the tricolour', era: '2004–' },
  ]),
  e('Slovakia', 'sk', 'Bratislava', '8 regions', [
    { name: 'Pan-Slavic tricolour of 1848', era: '1848' },
    { name: 'Arms added at independence', era: '1992–' },
  ]),
  e('Slovenia', 'si', 'Ljubljana', '212 municipalities', [
    { name: 'Yugoslav-era star', era: '1946–1991' },
    { name: 'Triglav arms', era: '1991–' },
  ]),
  e('Spain', 'es', 'Madrid', '17 autonomous communities', [
    { name: 'Second Republic tricolour', era: '1931–1939' },
    { name: 'Francoist eagle variants', era: '1939–1981' },
    { name: 'Current arms', era: '1981–' },
  ]),
  e('Sweden', 'se', 'Stockholm', '21 counties', [
    { name: 'Union mark with Norway', era: '1844–1905' },
    { name: 'Current flag law', era: '1906–' },
  ]),
  e('Switzerland', 'ch', 'Bern', '26 cantons', [
    { name: 'Federal white cross — one of two square national flags', era: '1848–' },
  ]),
  e('Ukraine', 'ua', 'Kyiv', '24 oblasts', [
    { name: 'Ukrainian SSR red-azure', era: '1949–1991' },
    { name: 'Blue-gold restored', era: '1992–' },
  ]),
  e('United Kingdom', 'gb', 'London', '4 constituent countries', [
    { name: 'First Union Flag — no St Patrick’s saltire', era: '1606–1801' },
    { name: 'Union Jack', era: '1801–' },
  ]),
  e('Vatican City', 'va', 'Vatican City', 'City-state', [
    { name: 'Keys and tiara — square flag of the Lateran Treaty', era: '1929–' },
  ]),
]

export const CODEX_TOTALS = { countries: 197, europe: europe.length, entries: '4,000+' }
