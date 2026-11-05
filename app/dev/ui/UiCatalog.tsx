"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { iconRegistry } from "@/components/icons/registry";
import { TvNavigation } from "@/components/TvNavigation";
import {
  Alert, Badge, Breadcrumb, Button, Card, Dialog, EmptyState, ErrorState,
  ForbiddenState, IconButton, Loader, MediaArtwork, OfflineState, PageContainer,
  PageHeader, Pagination, Panel, Select, Sheet, Skeleton, Table, Tabs, TextArea,
  TextField, Toast, UiTheme
} from "@/components/ui";
import styles from "./catalog.module.css";

const samples = [
  { id: "a", title: "Exemple de vidéo", state: "Brouillon" },
  { id: "b", title: "Exemple d’épisode", state: "Planifié" },
  { id: "c", title: "Exemple de Flashy", state: "Publié" }
];

export function UiCatalog() {
  const [activeTab, setActiveTab] = useState("controls");
  const [tv, setTv] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("empty");
  const filtered = samples.filter((item) => item.title.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const current = filtered[page - 1];

  function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError("Saisissez un titre pour continuer."); setSaved(false); return; }
    setError("");
    setSaved(true);
    setToast("Exemple enregistré localement dans cette prévisualisation.");
  }

  const controls = <div className={styles.stack}>
    <Panel title="Une action, un langage commun">
      <p>Les mêmes contrôles pour Nino et Studio, avec des variantes selon l’intention.</p>
      <div className={styles.row}>
        <Button onClick={() => setToast("Action de démonstration : regarder.")}><Icon name="play" size={18} />Regarder</Button>
        <Button variant="secondary" onClick={() => setToast("Action de démonstration : enregistrer.")}><Icon name="save" size={18} />Enregistrer</Button>
        <Button variant="quiet" onClick={() => setToast("Action de démonstration : annuler.")}>Annuler</Button>
        <Button variant="danger" onClick={() => setDialogOpen(true)}>Supprimer l’exemple</Button>
        <IconButton label="Rechercher dans les exemples" variant="secondary" onClick={() => setActiveTab("data")}><Icon name="search" size={20} /></IconButton>
      </div>
      <div className={styles.row}>
        <Button size="compact" onClick={() => setToast("Variante compacte, cible de 44 px minimum.")}>Compact</Button>
        <Button size="tv" onClick={() => setToast("Variante TV, cible de 56 px minimum.")}>Télévision</Button>
        <Button disabled>Indisponible</Button><Button busy>Enregistrement…</Button>
      </div>
    </Panel>
    <section><h2>États lisibles sans dépendre de la couleur</h2><div className={styles.row}>
      <Badge>Brouillon</Badge><Badge tone="warning">Planifié</Badge><Badge tone="success">Publié</Badge><Badge tone="danger">Échec</Badge>
    </div></section>
    <section><h2>Palette et surfaces</h2><div className={styles.swatches}>
      {["bg", "surface", "elevated", "coral", "orange", "success", "warning", "danger"].map((color) => <div key={color}><span style={{ background: `var(--nino-${color})` }} /><span>{color}</span></div>)}
    </div><p>Accent orange avec texte sombre ; corail réservé à l’identité. Sora est déjà embarquée.</p></section>
  </div>;

  const forms = <div className={styles.twoColumns}>
    <Panel title="Un formulaire explicite">
      <form onSubmit={save} noValidate className={styles.stack}>
        <TextField label="Titre de l’exemple" required value={title} error={error} hint="Champ obligatoire. Aucune donnée envoyée au serveur."
          onChange={(event) => { setTitle(event.target.value); setSaved(false); }} />
        <Select label="Visibilité de l’exemple" defaultValue="draft" hint="Sélecteur natif utilisable au clavier."><option value="draft">Brouillon</option><option value="private">Privé</option><option value="public">Public</option></Select>
        <TextArea label="Description de l’exemple" placeholder="Présentez votre programme…" />
        <TextField label="Champ indisponible" value="Lecture seule dans cette démo" disabled />
        <div className={styles.row}><Button type="submit"><Icon name="save" size={18} />Enregistrer l’exemple</Button><Badge tone={saved ? "success" : "neutral"}>{saved ? "Enregistré localement" : "Non enregistré"}</Badge></div>
      </form>
    </Panel>
    <section><h2>Labels, aide et erreurs</h2><p>Chaque champ possède un label visible. L’aide et l’erreur sont associées au contrôle. Essayez d’enregistrer sans titre.</p><Alert title="Prévisualisation isolée">Les états de publication présentés ici sont des exemples ; ils ne modifient aucun média.</Alert></section>
  </div>;

  const feedback = <div className={styles.stack}>
    <div className={styles.twoColumns}><Alert title="Exemple enregistré" tone="success">Le retour confirme l’action locale.</Alert><Alert title="Publication en attente" tone="warning">Exemple d’un état planifié.</Alert></div>
    <Panel title="Un état adapté à chaque situation">
      <Select label="État à prévisualiser" value={state} onChange={(event) => setState(event.target.value)}>
        <option value="empty">Vide</option><option value="loading">Chargement</option><option value="error">Erreur</option><option value="offline">Connexion perdue</option><option value="forbidden">Accès refusé</option>
      </Select>
      {state === "empty" ? <EmptyState title="Aucun programme pour le moment" message="Les contenus disponibles apparaîtront ici." /> : null}
      {state === "loading" ? <div className={styles.stack}><Loader label="Chargement des programmes…" /><Skeleton /></div> : null}
      {state === "error" ? <ErrorState message="Le chargement a échoué. Vous pouvez réessayer." onRetry={() => setToast("Nouvelle tentative simulée, aucun appel réseau.")} /> : null}
      {state === "offline" ? <OfflineState onRetry={() => setToast("Connexion non testée : démonstration locale.")} /> : null}
      {state === "forbidden" ? <ForbiddenState /> : null}
    </Panel>
  </div>;

  const data = <div className={styles.stack}>
    <Panel title="Tableau et pagination">
      <TextField type="search" label="Rechercher un exemple" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
      <Table caption="Données de démonstration uniquement — un exemple par page">
        <thead><tr><th scope="col">Programme</th><th scope="col">État</th><th scope="col">Action</th></tr></thead>
        <tbody>{current ? <tr><th scope="row">{current.title}</th><td><Badge>{current.state}</Badge></td><td><Button variant="secondary" size="compact" onClick={() => setSheetOpen(true)}>Inspecter</Button></td></tr> : <tr><td colSpan={3}>Aucun exemple ne correspond à votre recherche.</td></tr>}</tbody>
      </Table>
      <Pagination page={page} pageCount={filtered.length} onPageChange={setPage} />
    </Panel>
    <section><h2>Visuels sans média fictif</h2><div className={styles.artworkGrid}>
      <Card><MediaArtwork label="Aucun visuel vidéo" /><h3>Vidéo · 16:9</h3></Card>
      <Card><MediaArtwork label="Aucune affiche" aspect="poster" /><h3>Affiche · 2:3</h3></Card>
      <Card><MediaArtwork label="Aucun visuel Flashy" aspect="short" /><h3>Flashy · 9:16</h3></Card>
    </div></section>
  </div>;

  const interactions = <div className={styles.stack}>
    <Panel title="Dialogues et panneaux">
      <p>Échap ferme, Tab reste dans le dialogue et le focus revient au déclencheur. Le panneau latéral utilise le même mécanisme.</p>
      <div className={styles.row}><Button onClick={() => setDialogOpen(true)} aria-haspopup="dialog">Ouvrir le dialogue</Button><Button variant="secondary" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">Ouvrir le panneau</Button></div>
    </Panel>
    <section><h2>Clavier et télécommande simulée</h2><p>Tab parcourt les contrôles. Les flèches gauche et droite déplacent le focus des onglets ; Entrée ou Espace les active. Les champs et les listes conservent leurs touches natives.</p><p>Le mode TV augmente les textes et les cibles. Il permet un essai D-pad dans le navigateur ; la qualification sur téléviseur reste à faire.</p></section>
  </div>;

  const icons = <div className={styles.stack}>
    <section><h2>Un nom commun, un fournisseur adapté</h2><p>Papicons en priorité ; Lucide complète les besoins. Le logo Nino reste un asset de marque.</p>
      <div className={styles.iconGrid}>{Object.keys(iconRegistry).map((name) => <div key={name}><Icon name={name} size={28} /><span>{name}</span></div>)}</div>
    </section>
    <Panel title="Variantes et sens">
      <div className={styles.row}><Icon name="heart" variant="outline" size={32} /><span>Contour</span><Icon name="heart" variant="solid" size={32} /><span>Plein</span></div>
      <div className={styles.row}><Icon name="warning" state="error" decorative={false} label="Exemple : publication en échec" size={28} /><span>Erreur</span><Icon name="check" state="success" decorative={false} label="Exemple : enregistrement réussi" size={28} /><span>Succès</span></div>
      <div className={styles.row}><Icon name="reference-inconnue" decorative={false} label="Icône de remplacement" size={28} /><span>Référence inconnue : remplacement sûr</span></div>
      <div className={styles.lightSample}><Icon name="search" size={28} /><span>La couleur suit le texte, sur fond clair comme sombre.</span></div>
    </Panel>
  </div>;

  return <UiTheme tv={tv}>
    <TvNavigation />
    <a href="#ui-content" className={styles.skip}>Aller aux composants</a>
    <PageContainer>
      <div className={styles.brandRow}><Image src="/logo_nino.png" width={111} height={42} alt="Nino" priority /><Badge>Atelier V9 · développement</Badge></div>
      <Breadcrumb><li>Nino / Studio</li><li aria-current="page">Composants</li></Breadcrumb>
      <PageHeader title="Le même langage, deux expériences." description="Une base commune pour regarder et créer. Cet atelier présente les composants V9 avant leur intégration aux pages Nino et Studio."
        actions={<Button variant="secondary" aria-pressed={tv} onClick={() => setTv(!tv)}>{tv ? "Mode TV actif" : "Essayer le mode TV"}</Button>} />
      <main id="ui-content" tabIndex={-1}>
        <Tabs label="Bibliothèque de composants" activeId={activeTab} onChange={setActiveTab} items={[
          { id: "controls", label: "Contrôles", content: controls },
          { id: "forms", label: "Formulaires", content: forms },
          { id: "feedback", label: "États & retours", content: feedback },
          { id: "data", label: "Données & visuels", content: data },
          { id: "interactions", label: "Interactions", content: interactions },
          { id: "icons", label: "Icônes", content: icons }
        ]} />
      </main>
      <footer className={styles.footer}>Prévisualisation locale, sans appel API. Les trois pilotes et le GO visuel restent à venir.</footer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Supprimer cet exemple ?" description="Cette action sert uniquement à essayer la confirmation. Aucun contenu réel ne sera supprimé.">
        <div className={styles.row}><Button variant="secondary" onClick={() => setDialogOpen(false)}>Conserver l’exemple</Button><Button variant="danger" onClick={() => { setDialogOpen(false); setToast("Suppression simulée, aucune donnée modifiée."); }}>Confirmer la simulation</Button></div>
      </Dialog>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Inspecteur de démonstration" description="Un panneau pour les informations contextuelles de Studio.">
        <div className={styles.stack}><TextField label="Note locale" placeholder="Essayez le clavier…" /><Alert title="Aucun média sélectionné">Ce panneau illustre uniquement le composant partagé.</Alert><Button variant="secondary" onClick={() => setSheetOpen(false)}>Fermer le panneau</Button></div>
      </Sheet>
      {toast ? <div className={styles.toastDock}><Toast message={toast} onDismiss={() => setToast("")} /></div> : null}
    </PageContainer>
  </UiTheme>;
}
