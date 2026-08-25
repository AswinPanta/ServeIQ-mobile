/**
 * Country → States/Provinces mapping for the property listing wizard.
 * Used to populate the state dropdown with relevant options based on
 * the selected country. Only major countries are included; others
 * allow free-text input.
 */

export const COUNTRY_STATES: Record<string, string[]> = {
  Nepal: [
    'Bagmati', 'Gandaki', 'Lumbini', 'Koshi', 'Madhesh', 'Sudurpashchim', 'Karnali',
  ],
  India: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Chandigarh', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
  ],
  Canada: [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
    'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland',
  ],
  Australia: [
    'Australian Capital Territory', 'New South Wales', 'Northern Territory',
    'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
  ],
  China: [
    'Beijing', 'Shanghai', 'Guangdong', 'Sichuan', 'Yunnan', 'Zhejiang',
    'Jiangsu', 'Shandong', 'Hubei', 'Hunan', 'Fujian', 'Anhui', 'Henan',
    'Hebei', 'Shaanxi', 'Guangxi', 'Hainan', 'Chongqing', 'Tianjin',
    'Liaoning', 'Jilin', 'Heilongjiang', 'Inner Mongolia', 'Xinjiang',
    'Tibet', 'Qinghai', 'Gansu', 'Ningxia', 'Guizhou', 'Jiangxi', 'Shanxi',
  ],
  Japan: [
    'Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kinki', 'Chugoku', 'Shikoku', 'Kyushu',
    'Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Fukuoka', 'Nagoya', 'Sapporo',
  ],
  Thailand: [
    'Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Surat Thani', 'Pattaya',
    'Nonthaburi', 'Pak Kret', 'Udon Thani', 'Chon Buri', 'Nakhon Ratchasima',
  ],
  Indonesia: [
    'Bali', 'Jakarta', 'West Java', 'East Java', 'Central Java', 'Yogyakarta',
    'North Sumatra', 'South Sumatra', 'Riau', 'Aceh', 'West Nusa Tenggara',
    'East Nusa Tenggara', 'North Sulawesi', 'South Sulawesi', 'Kalimantan',
  ],
  Singapore: ['Singapore'],
  Malaysia: [
    'Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Kedah',
    'Kelantan', 'Pahang', 'Terengganu', 'Sabah', 'Sarawak', 'Malacca',
    'Negeri Sembilan', 'Perlis', 'Putrajaya', 'Labuan',
  ],
  Vietnam: [
    'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Nha Trang',
    'Phu Quoc', 'Hue', 'Can Tho', 'Hai Phong', 'Dalat',
  ],
  'Sri Lanka': [
    'Western Province', 'Central Province', 'Southern Province', 'Northern Province',
    'Eastern Province', 'North Western Province', 'North Central Province',
    'Uva Province', 'Sabaragamuwa Province',
  ],
  Maldives: ['Malé', 'Addu City', 'Fuvahmulah'],
  'South Korea': [
    'Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju',
    'Ulsan', 'Gyeonggi-do', 'Gangwon-do', 'Chungcheongbuk-do',
    'Chungcheongnam-do', 'Jeollabuk-do', 'Jeollanam-do',
    'Gyeongsangbuk-do', 'Gyeongsangnam-do', 'Jeju',
  ],
  Philippines: [
    'Metro Manila', 'Cebu', 'Davao', 'Iloilo', 'Bacolod', 'Palawan',
    'Bohol', 'Aklan', 'Leyte', 'Zambales', 'Pampanga', 'Laguna',
  ],
  France: [
    'Île-de-France', "Provence-Alpes-Côte d'Azur", 'Occitanie',
    'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Hauts-de-France',
    'Bretagne', 'Grand Est', 'Normandie', 'Pays de la Loire',
    'Centre-Val de Loire', 'Corse', 'Guadeloupe', 'Martinique',
    'Réunion', 'Guyane',
  ],
  Germany: [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
    'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
    'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
    'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
  ],
  Italy: [
    'Lombardy', 'Lazio', 'Campania', 'Sicily', 'Veneto', 'Emilia-Romagna',
    'Piedmont', 'Tuscany', 'Liguria', 'Marche', 'Abruzzo', 'Friuli Venezia Giulia',
    'Sardinia', 'Apulia', 'Calabria', 'Basilicata', 'Molise', 'Umbria',
    'Trentino-Alto Adige', 'Aosta Valley',
  ],
  Spain: [
    'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Canary Islands',
    'Cantabria', 'Castile and León', 'Castilla-La Mancha', 'Catalonia',
    'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarre',
    'Basque Country', 'Valencia',
  ],
  Greece: [
    'Attica', 'Central Macedonia', 'Crete', 'Peloponnese', 'Thessaly',
    'Epirus', 'Ionian Islands', 'North Aegean', 'South Aegean',
    'Central Greece', 'Western Greece', 'Eastern Macedonia and Thrace',
  ],
  Turkey: [
    'Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Muğla',
    'Nevşehir', 'Trabzon', 'Edirne', 'Bodrum', 'Marmaris',
  ],
  'United Arab Emirates': [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
    'Fujairah', 'Umm Al Quwain',
  ],
  Egypt: [
    'Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Red Sea',
    'South Sinai', 'Hurghada', 'Sharm El Sheikh',
  ],
  Morocco: [
    'Casablanca', 'Marrakech', 'Fez', 'Tangier', 'Agadir', 'Rabat',
    'Chefchaouen', 'Essaouira', 'Ouarzazate',
  ],
  'South Africa': [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
  ],
  Kenya: [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Nyeri',
    'Malindi', 'Lamu',
  ],
  Tanzania: [
    'Dar es Salaam', 'Arusha', 'Zanzibar', 'Mwanza', 'Dodoma', 'Kilimanjaro',
  ],
  Brazil: [
    'São Paulo', 'Rio de Janeiro', 'Bahia', 'Minas Gerais', 'Paraná',
    'Santa Catarina', 'Rio Grande do Sul', 'Pernambuco', 'Ceará',
    'Goiás', 'Amazonas', 'Maranhão', 'Pará', 'Espírito Santo',
  ],
  Mexico: [
    'Mexico City', 'Jalisco', 'Quintana Roo', 'Yucatán', 'Baja California Sur',
    'Guerrero', 'Oaxaca', 'Chiapas', 'Michoacán', 'Guanajuato',
    'Puebla', 'Veracruz', 'Nuevo León', 'Querétaro', 'Tulum', 'Cancún',
  ],
  Portugal: [
    'Lisbon', 'Porto', 'Faro', 'Madeira', 'Azores', 'Braga',
    'Coimbra', 'Setúbal', 'Évora',
  ],
  Cambodia: [
    'Phnom Penh', 'Siem Reap', 'Sihanoukville', 'Battambang',
    'Kampot', 'Kep',
  ],
  Laos: [
    'Vientiane', 'Luang Prabang', 'Champasak', 'Savannakhet',
  ],
  Myanmar: [
    'Yangon', 'Mandalay', 'Bagan', 'Inle Lake', 'Naypyidaw',
  ],
  'New Zealand': [
    'Auckland', 'Wellington', 'Canterbury', 'Bay of Plenty',
    'Waikato', 'Otago', "Hawke's Bay", 'Taranaki', 'Northland',
    'Manawatū-Whanganui', 'West Coast', 'Marlborough', 'Nelson',
    'Tasman', 'Gisborne', 'Southland', 'Chatham Islands',
  ],
  Switzerland: [
    'Zürich', 'Geneva', 'Bern', 'Basel', 'Lucerne', 'Interlaken',
    'Zermatt', 'St. Moritz', 'Davos', 'Lausanne', 'Lugano',
  ],
  Austria: [
    'Vienna', 'Salzburg', 'Innsbruck', 'Graz', 'Linz', 'Klagenfurt',
    'Hallstatt', 'Tyrol', 'Carinthia', 'Styria', 'Vorarlberg',
  ],
};

/**
 * Get states for a given country name.
 * Returns an empty array if the country is not in the mapping.
 */
export function getStatesForCountry(country: string): string[] {
  return COUNTRY_STATES[country] || [];
}
