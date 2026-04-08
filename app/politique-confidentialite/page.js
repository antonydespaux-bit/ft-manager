export default function PolitiqueConfidentialite() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', color: '#18181B', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Politique de Confidentialité</h1>
      <p style={{ color: '#71717A', fontSize: '13px', marginBottom: '32px' }}>Version 1.0 — Dernière mise à jour : avril 2026</p>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>1. Responsable du traitement</h2>
        <p><strong>Skalcook SAS</strong> est responsable du traitement des données personnelles collectées via l'application Skalcook.</p>
        <p><strong>Contact DPO :</strong> <a href="mailto:contact@skalcook.fr" style={{ color: '#6366F1' }}>contact@skalcook.fr</a></p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>2. Données collectées</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Données d'identification :</strong> nom, adresse e-mail, numéro de téléphone</li>
          <li><strong>Données professionnelles :</strong> nom de l'établissement, SIRET, numéro TVA, adresse</li>
          <li><strong>Données d'utilisation :</strong> fiches techniques, recettes, ingrédients, stocks</li>
          <li><strong>Données de connexion :</strong> adresse IP, logs d'accès, navigateur</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>3. Finalités du traitement</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Fournir le service Skalcook (exécution du contrat)</li>
          <li>Gérer votre compte et votre abonnement</li>
          <li>Assurer la sécurité et la maintenance de l'application</li>
          <li>Répondre à vos demandes de support</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>4. Base légale du traitement</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Exécution du contrat (art. 6.1.b RGPD) :</strong> traitement nécessaire à la fourniture du service</li>
          <li><strong>Obligation légale (art. 6.1.c RGPD) :</strong> conservation des données de facturation</li>
          <li><strong>Intérêt légitime (art. 6.1.f RGPD) :</strong> sécurité, prévention des fraudes</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>5. Durée de conservation</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Données du compte :</strong> durée de l'abonnement + 30 jours après résiliation</li>
          <li><strong>Données de facturation :</strong> 10 ans (obligation comptable)</li>
          <li><strong>Logs de connexion :</strong> 12 mois</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>6. Destinataires des données</h2>
        <p>Vos données sont transmises aux sous-traitants techniques suivants :</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Supabase Inc.</strong> — hébergement de la base de données (serveurs en Europe)</li>
          <li><strong>Vercel Inc.</strong> — hébergement de l'application</li>
        </ul>
        <p>Nous ne vendons ni ne louons vos données à des tiers.</p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>7. Vos droits (RGPD)</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Droit d'accès (art. 15) :</strong> obtenir une copie de vos données</li>
          <li><strong>Droit de rectification (art. 16) :</strong> corriger vos données</li>
          <li><strong>Droit à l'effacement (art. 17) :</strong> supprimer vos données</li>
          <li><strong>Droit à la portabilité (art. 20) :</strong> exporter vos données (disponible dans Mon Compte)</li>
          <li><strong>Droit d'opposition (art. 21) :</strong> vous opposer à certains traitements</li>
        </ul>
        <p>Contact : <a href="mailto:contact@skalcook.fr" style={{ color: '#6366F1' }}>contact@skalcook.fr</a> — Délai de réponse : 30 jours maximum.</p>
        <p>En cas de réclamation non traitée, vous pouvez saisir la <strong>CNIL</strong> (www.cnil.fr).</p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>8. Sécurité</h2>
        <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS/TLS, authentification sécurisée via Supabase Auth, accès restreint par rôles, sauvegardes régulières.</p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>9. Cookies</h2>
        <p>L'application utilise uniquement des cookies techniques strictement nécessaires au fonctionnement (session d'authentification). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.</p>
      </section>

      <div style={{ marginTop: '40px', padding: '16px', background: '#EEF2FF', borderRadius: '8px', fontSize: '12px', color: '#4338CA' }}>
        <strong>CNIL :</strong> Vous pouvez également adresser une réclamation à la Commission Nationale de l'Informatique et des Libertés (CNIL) — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1' }}>www.cnil.fr</a>
      </div>
    </div>
  )
}
