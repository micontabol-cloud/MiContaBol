/**
 * Temas listos para el catálogo público. La mayoría de comerciantes no
 * sabe combinar colores, y un selector libre termina en algo feo — es
 * mejor darle opciones ya resueltas y dejar que solo elija su color de
 * acento.
 */
export const TEMAS = {
  claro: {
    nombre: 'Claro',
    descripcion: 'Limpio y luminoso. Va bien con casi todo.',
    fondo: '#F7F9FC',
    superficie: '#FFFFFF',
    texto: '#253046',
    textoSuave: '#64748B',
    borde: '#E6ECF3',
    encabezadoTexto: '#FFFFFF',
  },
  elegante: {
    nombre: 'Elegante',
    descripcion: 'Oscuro y sobrio. Ideal para joyerías y boutiques.',
    fondo: '#14181F',
    superficie: '#1D232D',
    texto: '#F2F4F7',
    textoSuave: '#9BA6B5',
    borde: '#2C333F',
    encabezadoTexto: '#FFFFFF',
  },
  calido: {
    nombre: 'Cálido',
    descripcion: 'Tonos tierra. Para artesanías, comida, ropa casual.',
    fondo: '#FBF7F2',
    superficie: '#FFFFFF',
    texto: '#3A2E25',
    textoSuave: '#8A7763',
    borde: '#EADFD2',
    encabezadoTexto: '#FFFFFF',
  },
  vibrante: {
    nombre: 'Vibrante',
    descripcion: 'Con energía. Para ofertas y liquidaciones.',
    fondo: '#FFF8F8',
    superficie: '#FFFFFF',
    texto: '#2B1F26',
    textoSuave: '#7A6670',
    borde: '#F6E3E5',
    encabezadoTexto: '#FFFFFF',
  },
}

export function obtenerTema(clave) {
  return TEMAS[clave] || TEMAS.claro
}
