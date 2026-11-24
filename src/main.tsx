import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/archivo';
import { LIBRARY_SCANS, scanLabel, scanPage, scanRecord, scanView } from './libraryScans';
import type { LibraryScan } from './libraryScans';
import './style.css';

const Viewer = lazy(() => import('./LibraryScanViewer'));
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const group = (scan: LibraryScan) => scan.project ? 'Polideportivo' : scanRecord(scan)?.course ?? 'Otros escaneos';
const groups = ['Todos', ...new Set(LIBRARY_SCANS.map(group))];
const title = (scan: LibraryScan) => scan.project ? `${scan.project.name} · ${scan.title === 'Maqueta taller 3' ? 'Taller 3' : 'San Antonio'}` : scan.title;

class ViewerBoundary extends Component<{ children: ReactNode; source: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="viewer-placeholder" role="status"><p>El visor 3D no está disponible en este dispositivo.</p><a href={this.props.source} target="_blank" rel="noreferrer">Ver escaneo en Scaniverse</a></div> : this.props.children;
  }
}

function ModelDialog({ scan, close }: { scan: LibraryScan; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [rotating, setRotating] = useState(false);

  const [fullError, setFullError] = useState('');
  const record = scanRecord(scan);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  async function fullscreen() {
    try { await stage.current?.requestFullscreen(); }
    catch { setFullError('Tu navegador no permite pantalla completa. Puedes ampliar la ventana.'); }
  }
  return <dialog ref={dialog} aria-labelledby="model-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="dialog-shell">
      <header className="dialog-heading"><div><p className="eyebrow">Colección de maquetas</p><h2 id="model-title">{title(scan)}</h2></div><button className="close" onClick={close} aria-label="Cerrar modelo">×</button></header>
      <div className="dialog-grid">
        <section className="model-content" aria-label="Vista del modelo">
          <div className="stage" ref={stage}>
            {loaded ? <ViewerBoundary source={scanPage(scan)}><Suspense fallback={<p className="library-model-message" role="status">Preparando visor 3D…</p>}><Viewer scan={scan} turntable={rotating} /></Suspense></ViewerBoundary> : <>
              <img className="stage-image" src={scanView(scan, angle)} alt={`Vista ${angle + 1} de ${title(scan)}`} />
              <button className="start-3d" onClick={() => setLoaded(true)}><span aria-hidden="true">◇</span> Explorar en 3D</button>
            </>}
          </div>
          {loaded ? <div className="viewer-toolbar"><button onClick={() => setRotating(!rotating)} aria-pressed={rotating}>{rotating ? 'Pausar giro' : 'Giro automático'}</button><button onClick={() => window.dispatchEvent(new Event("gallery-reset-view"))}>Restablecer vista</button><button onClick={fullscreen}>Pantalla completa</button><button onClick={() => { setLoaded(false); setRotating(false); }}>Ver fotografías</button></div> : <div className="thumbnails" aria-label="Vistas de la maqueta">{Array.from({ length: scan.angles }, (_, index) => <button key={index} aria-label={`Ver fotografía ${index + 1}`} aria-pressed={angle === index} onClick={() => setAngle(index)}><img src={scanView(scan, index)} alt="" /></button>)}</div>}
          <p className="hint">{loaded ? 'Arrastra para girar · Rueda o gesto de pinza para acercar · Botón derecho para desplazar' : 'Recorre las fotografías o abre el modelo para explorarlo en tres dimensiones.'}</p>
          {fullError && <p role="status">{fullError}</p>}
        </section>
        <aside className="model-details"><span className="tag">{group(scan)}</span><h3>Acerca de este registro</h3><dl>
          <dt>Título original</dt><dd>{scan.title}</dd>
          {record?.author && <><dt>Apellido en el registro</dt><dd>{record.author}</dd></>}
          {record?.course && <><dt>Taller</dt><dd>{record.course}</dd></>}
          {record?.year && <><dt>Año</dt><dd>{record.year}</dd></>}
          {record?.project && <><dt>Ubicación del encargo</dt><dd>{record.project.place}</dd><dt>Docentes del encargo</dt><dd>{record.project.teachers.join(', ')}</dd></>}
          <dt>Cuenta que publicó el escaneo</dt><dd>{scan.author}</dd>
        </dl><a className="source-link" href={scanPage(scan)} target="_blank" rel="noreferrer">Consultar registro original en Scaniverse</a><p className="metadata-note">Los créditos corresponden a la información disponible en el registro. La cuenta que publica el escaneo no identifica necesariamente a la persona autora del proyecto.</p></aside>
      </div>
    </div>
  </dialog>;
}

function App() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<LibraryScan | null>(null);
  useEffect(() => {
    const readHash = () => {
      const id = new URLSearchParams(location.hash.slice(1)).get('modelo');
      setSelected(LIBRARY_SCANS.find(scan => scan.id === id) ?? null);
    };
    readHash(); window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = LIBRARY_SCANS.filter(scan => (category === 'Todos' || group(scan) === category) && normalize(`${scanLabel(scan)} ${scan.title} ${scan.author}`).includes(normalize(search)));
  function close() { history.replaceState(null, '', location.pathname + location.search); setSelected(null); }
  return <>
    <a className="skip" href="#coleccion">Ir a la colección</a>
    <header className="masthead"><a href="#" className="brand" aria-label="Archivo USACH, inicio"><img src={asset('identidad-usach/escudo-usach-recortado.png')} alt="" /><span><strong>ARCHIVO USACH</strong><small>Arquitectura · Galería 3D</small></span></a><a className="nav-link" href="#coleccion">Explorar colección</a></header>
    <main>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">Maquetas · Escaneos · Arquitectura</p><h1>Arquitectura<br />para <em>explorar.</em></h1><p className="intro">Una mirada a las maquetas y sus espacios. Acércate, cambia de perspectiva y recorre la colección en tres dimensiones.</p><a className="primary-link" href="#coleccion">Ver los modelos</a><p className="hero-caption">Proyecto Archivo USACH · Universidad de Santiago de Chile</p></div><div className="hero-visual"><img src={scanView(LIBRARY_SCANS[0], 0)} alt="Maqueta del encargo Polideportivo en San Antonio" fetchPriority="high" /><span className="visual-label">Polideportivo · San Antonio, Chile</span><span className="visual-badge">EXPLORACIÓN 3D</span></div></section>
      <section id="coleccion" className="collection" aria-labelledby="collection-title"><div className="section-head"><div><p className="eyebrow">La colección</p><h2 id="collection-title">Espacios, materia y memoria.</h2></div><span className="collection-total">{LIBRARY_SCANS.length} modelos para explorar</span></div>
        <div className="filters"><label className="search"><span>Buscar modelo</span><input type="search" placeholder="Título, taller o apellido…" value={search} onChange={event => setSearch(event.target.value)} /></label><label className="category"><span>Colección</span><select aria-label="Colección" value={category} onChange={event => setCategory(event.target.value)}>{groups.map(item => <option key={item}>{item}</option>)}</select></label></div>
        <p className="result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'modelo' : 'modelos'}</p>
        <div className="cards">{filtered.map(scan => <article key={scan.id} className="card"><button className="card-open" onClick={() => { location.hash = `modelo=${scan.id}`; }} aria-label={`Explorar ${title(scan)}`}><div className="card-image"><img src={scanView(scan, 0)} alt={`Maqueta: ${title(scan)}`} loading="lazy" /><span className="model-badge">3D</span><span className="card-action">Explorar modelo</span></div><div className="card-copy"><p className="card-category">{group(scan)}</p><h3>{title(scan)}</h3><p>{scanRecord(scan)?.year ?? 'Escaneo de maqueta'}<span aria-hidden="true"> · </span>{scan.author}</p></div></button></article>)}</div>
        {filtered.length === 0 && <div className="empty"><h3>No encontramos modelos con esa búsqueda.</h3><button onClick={() => { setSearch(''); setCategory('Todos'); }}>Ver toda la colección</button></div>}
      </section>
      <section className="about"><p className="eyebrow">Del objeto al archivo</p><h2>Otra forma de mirar<br />la maqueta.</h2><div><p>Esta colección reúne escaneos de maquetas vinculadas a la Escuela de Arquitectura. Cada registro conserva sus vistas, la información disponible y un enlace a su publicación de origen.</p><p>Abre una maqueta y pulsa «Explorar en 3D» para recorrerla. También puedes consultar las fotografías desde cualquier dispositivo.</p></div></section>
    </main>
    <footer><span>ARCHIVO USACH <span className="footer-divider">/</span> Galería pública de arquitectura</span><span>Escaneos y créditos en cada registro.</span></footer>
    {selected && <ModelDialog key={selected.id} scan={selected} close={close} />}
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);


