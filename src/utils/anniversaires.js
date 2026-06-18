export function getAnniversairesClients(clients, anneeDebut, anneeFin) {
  const events = [];

  for (const client of clients) {
    if (!client.date_naissance) continue;

    const [anneeNaissance, mois, jour] = client.date_naissance.split('-').map(Number);
    const prenom = client.prenom ?? '';
    const nom = client.nom ?? '';

    for (let annee = anneeDebut; annee <= anneeFin; annee++) {
      events.push({
        id: `anniv-${client.id}-${annee}`,
        title: `🎂 Anniversaire de ${prenom} ${nom}`,
        start: `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`,
        allDay: true,
        backgroundColor: '#8e44ad',
        borderColor: '#8e44ad',
        extendedProps: { type: 'anniversaire', client_id: client.id, age: annee - anneeNaissance },
      });
    }
  }

  return events;
}

export function getProchainAnniversaire(client) {
  if (!client.date_naissance) return null;

  const [anneeNaissance, mois, jour] = client.date_naissance.split('-').map(Number);
  const aujourd_hui = new Date();
  aujourd_hui.setHours(0, 0, 0, 0);

  const anneeEnCours = aujourd_hui.getFullYear();

  let prochainDate = new Date(anneeEnCours, mois - 1, jour);
  if (prochainDate < aujourd_hui) {
    prochainDate = new Date(anneeEnCours + 1, mois - 1, jour);
  }

  const joursRestants = Math.round((prochainDate - aujourd_hui) / (1000 * 60 * 60 * 24));
  const annee = prochainDate.getFullYear();
  const dateStr = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;

  return {
    date: dateStr,
    joursRestants,
    age: annee - anneeNaissance,
  };
}
