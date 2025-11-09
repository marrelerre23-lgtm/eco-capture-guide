interface ExportCapture {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  capturedAt: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  description: string;
  habitat?: string;
  rarity?: string;
  confidence?: number;
  notes?: string;
  isFavorite: boolean;
}

export const exportToCSV = (data: ExportCapture[]): void => {
  const headers = [
    'ID',
    'Artnamn',
    'Vetenskapligt namn',
    'Kategori',
    'Datum',
    'Plats',
    'Latitud',
    'Longitud',
    'Beskrivning',
    'Habitat',
    'Sällsynthet',
    'AI-säkerhet',
    'Anteckningar',
    'Favorit'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      item.id,
      `"${item.name}"`,
      `"${item.scientificName}"`,
      item.category,
      item.capturedAt,
      `"${item.location || ''}"`,
      item.latitude || '',
      item.longitude || '',
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.habitat || ''}"`,
      `"${item.rarity || ''}"`,
      item.confidence ? `${Math.round(item.confidence * 100)}%` : '',
      `"${item.notes || ''}"`,
      item.isFavorite ? 'Ja' : 'Nej'
    ].join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `species-captures-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: ExportCapture[]): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `species-captures-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
