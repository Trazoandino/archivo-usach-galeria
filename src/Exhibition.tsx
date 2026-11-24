import { useEffect, useRef, useState } from 'react';
import { LIBRARY_SCANS, scanView } from './libraryScans';
import type { LibraryScan } from './libraryScans';
import './exhibition.css';

export type PublicView = 'Exposición' | 'Repositorio' | 'Inicio' | 'Explorar';
type IconName = 'repository' | 'exhibition' | 'home' | 'people' | 'settings';
export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    repository: 'M4 3h4v18H4z M10 3h4v18h-4z M16 4l3-1 5 17-3 1z',
    exhibition: 'M12 5C8 2 3 3 2 4v16c3-2 7-1 10 1 3-2 7-3 10-1V4c-1-1-6-2-10 1v16 M6 7h2 M6 11h2 M16 7h2 M16 11h2',
    home: 'M3 10l9-8 9 8v12h-6v-8H9v8H3z',
    people: 'M16 21v-2a6 6 0 0 0-12 0v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 3a4 4 0 0 1 0 8 M21 21v-2a6 6 0 0 0-3-5',
    settings: 'M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  };
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

export function PublicHeader({ view, onView }: { view: PublicView; onView: (view: PublicView) => void }) {
  const [about, setAbout] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (about) dialog.current?.showModal(); }, [about]);
  const icons: Record<PublicView, IconName> = { Repositorio: 'repository', Exposición: 'exhibition', Inicio: 'home', Explorar: 'people' };
  return <>
    <header className="public-header"><button className="faculty-brand" onClick={() => onView('Exposición')} aria-label="Archivo USACH, Exposición"><img src={`${import.meta.env.BASE_URL}identidad-farac/farac-blanco.png`} alt="Facultad de Arquitectura y Ambiente Construido, USACH" /></button><nav aria-label="Navegación principal">{(['Repositorio', 'Exposición', 'Inicio', 'Explorar'] as const).map(item => <button key={item} onClick={() => onView(item)} aria-current={view === item ? 'page' : undefined}><Icon name={icons[item]} /><span>{item}</span></button>)}</nav><button className="header-settings" aria-label="Información de la galería" onClick={() => setAbout(true)}><Icon name="settings" /></button></header>
    {about && <dialog ref={dialog} className="info-dialog" onCancel={() => setAbout(false)}><button className="close" onClick={() => setAbout(false)} aria-label="Cerrar información">×</button><h2>Archivo USACH</h2><p>Exposición pública de maquetas y escaneos 3D. Explora los talleres o consulta los siete registros originales desde «Repositorio».</p><p>Los títulos, estudiantes y docentes de las tarjetas de exposición son datos de demostración del prototipo. Las maquetas son los escaneos disponibles en la biblioteca y conservan sus créditos originales al abrirlas.</p><button className="primary-link" onClick={() => setAbout(false)}>Volver a la exposición</button></dialog>}
  </>;
}

const sections = ['A', 'B', 'C', 'D'];
const teachers = ['Paula Herrera', 'Andrés Molina', 'Francisca Rojas', 'Rodrigo Valdés'];
const students = ['Camila Rojas', 'Vicente Muñoz', 'Antonia Soto', 'Matías Reyes', 'Josefa Vidal', 'Tomás Silva', 'Catalina Pérez', 'Benjamín Torres', 'Isidora Vega', 'Diego Fuentes', 'Emilia Castro', 'Joaquín Díaz', 'Florencia León', 'Agustín Morales', 'Trinidad Ríos', 'Nicolás Herrera'];
const projectTitles = ['Pabellón de luz', 'Habitar el borde', 'Patio compartido', 'Entre planos', 'Lugar de encuentro', 'La casa abierta', 'Paisaje interior', 'Trama urbana'];
const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const workshops = Array.from({ length: 11 }, (_, index) => ({
  level: index + 1,
  short: index < 2 ? `TD${index + 1}` : index === 2 ? 'TADA' : `TAD${index - 1}`,
  title: (index < 2 ? `Taller de Diseño ${romans[index]}` : `Taller de Diseño Arquitectónico ${romans[index - 2]}`) + (index === 9 ? ' (Anteproyecto de Título)' : index === 10 ? ' (Proyecto de Título)' : ''),
}));
// Misma selección e intercalado de vistas del prototipo React de la referencia.
const views = Array.from({ length: 4 }, (_, angle) => LIBRARY_SCANS.filter(scan => angle < scan.angles).map(scan => ({ scan, angle }))).flat();

export default function Exhibition({ onOpen }: { onOpen: (scan: LibraryScan) => void }) {
  const [semester, setSemester] = useState(2);
  const [active, setActive] = useState(1);
  const [settings, setSettings] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(Number(visible[0].target.getAttribute('data-level')));
    }, { rootMargin: '-140px 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('.workshop-level').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  function jump(level: number) {
    setActive(level);
    document.getElementById(`taller-${level}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  return <div className="exhibition-page">
    <aside className="workshop-rail" aria-label="Talleres">{workshops.map(workshop => <button key={workshop.level} onClick={() => jump(workshop.level)} aria-label={`Ir a ${workshop.title}`} aria-current={active === workshop.level ? 'location' : undefined}><span className="rail-number">{workshop.level}</span><span className="rail-dot" /><span className="rail-label">{workshop.short}</span></button>)}</aside>
    <main className={`exhibition-main${compact ? ' exhibition-compact' : ''}`} id="coleccion">
      <div className="exhibition-heading"><h1>Exposición de Taller</h1><div className="exhibition-period"><select aria-label="Semestre" value={semester} onChange={event => setSemester(Number(event.target.value))}><option value="1">Sem 1</option><option value="2">Sem 2</option></select><span>/</span><select aria-label="Año" value="2026" onChange={() => {}}><option value="2026">2026</option></select></div><div className="exhibition-options"><div className="subject-picker"><span>Asignaturas</span><select aria-label="Asignatura" defaultValue="taller"><option value="taller">Taller</option></select></div><div className="display-settings"><button className="display-trigger" aria-label="Opciones de visualización" aria-expanded={settings} onClick={() => setSettings(!settings)}><Icon name="settings" /></button>{settings && <div className="display-popover"><label><input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} /> Vista compacta</label><p>Selecciona una tarjeta para ver las fotografías y explorar la maqueta en 3D.</p></div>}</div></div></div>
      <div className="workshops">{workshops.map(workshop => <section className="workshop-level" key={workshop.level} data-level={workshop.level} id={`taller-${workshop.level}`} aria-labelledby={`title-${workshop.level}`}><h2 id={`title-${workshop.level}`}>{workshop.title}</h2><div className="workshop-sections">{sections.map((section, sectionIndex) => <section className={`workshop-section section-${section}`} key={section} aria-label={`${workshop.title}, Sección ${section}`}><header><h3>Sección {section}</h3><p>Docente · {teachers[sectionIndex]}</p></header><div className="workshop-projects">{[0, 1].map(rank => {
        const view = views[(sectionIndex * 2 + rank + (workshop.level - 1) * 8 + (semester - 1) * 3) % views.length];
        const projectTitle = projectTitles[(sectionIndex * 4 + rank + workshop.level - 1 + semester - 1) % projectTitles.length];
        const student = students[(sectionIndex * 4 + rank + workshop.level - 1) % students.length];
        return <button className="workshop-project" key={rank} onClick={() => onOpen(view.scan)} aria-label={`Abrir ${projectTitle}, ${student}`}><div className="workshop-image"><img src={scanView(view.scan, view.angle)} alt={`Vista de maqueta de la biblioteca para ${projectTitle}`} loading={workshop.level === 1 ? 'eager' : 'lazy'} /></div><div className="workshop-copy"><h4>{projectTitle === 'Habitar el borde' ? <>Habitar <br />el borde</> : projectTitle === 'Patio compartido' ? <>Patio <br />compartido</> : projectTitle}</h4><p>{student}</p></div></button>;
      })}</div></section>)}</div></section>)}</div>
      <p className="exhibition-disclosure">Exposición de demostración: títulos, estudiantes y docentes son datos de muestra del prototipo. Los siete escaneos se reutilizan para presentar la organización de los talleres. Los créditos de cada escaneo se consultan al abrir la maqueta.</p>
    </main>
  </div>;
}

