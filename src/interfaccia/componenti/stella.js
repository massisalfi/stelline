// Stellina disegnata dall'app (disegno originale, in SVG): piena, oppure solo il contorno con la classe "vuota".

const SVG = 'http://www.w3.org/2000/svg';

// Cinque punte con gli angoli arrotondati dal bordo (vedi lo stile .stella).
function punte(esterno, interno, cx = 50, cy = 53) {
  return Array.from({ length: 10 }, (_, i) => {
    const raggio = i % 2 ? interno : esterno;
    const angolo = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + raggio * Math.cos(angolo)).toFixed(1)},${(cy + raggio * Math.sin(angolo)).toFixed(1)}`;
  }).join(' ');
}

const FORMA = punte(43, 21);

export function disegnoStella(classe = '') {
  const disegno = document.createElementNS(SVG, 'svg');
  disegno.setAttribute('viewBox', '0 0 100 100');
  disegno.setAttribute('aria-hidden', 'true');
  disegno.setAttribute('class', `stella ${classe}`.trim());
  const forma = document.createElementNS(SVG, 'polygon');
  forma.setAttribute('points', FORMA);
  disegno.append(forma);
  return disegno;
}
