// Metadata de las 6 series de IPC empalmado.
// Cada "segmento" describe qué fuente/metodología cubre ese tramo de fechas,
// se usa tanto para armar la cinta visual como para el detalle textual del resultado.
const SERIES = {
  gba_sl_ipcba_gba_nacional: {
    file: "data/gba_sl_ipcba_gba_nacional.csv",
    label: "GBA → San Luis → CABA → GBA → Nacional",
    short: "Última serie base diciembre 2016=100",
    first: "1965-10", last: "2026-06",
    columns: ["Nivel general","Alimentos y bebidas no alcohólicas","Bebidas alcohólicas y tabaco","Prendas de vestir y calzado","Vivienda, agua, electricidad y otros combustibles","Equipamiento y manteni-miento del hogar","Salud","Transporte","Comunicaciones","Recreación y cultura","Educación","Restaurantes y hoteles","Otros bienes y servicios","Estacional","Núcleo","Regulados","Bienes","Servicios"],
    segments: [
      {to:"2006-12", label:"IPC GBA (INDEC) empalmado con series anteriores"},
      {to:"2012-07", label:"IPC San Luis"},
      {to:"2016-04", label:"IPC CABA"},
      {to:"2016-12", label:"IPC GBA (INDEC)"},
      {to:"2026-06", label:"IPC Nacional (INDEC)"},
    ]
  },
  gba_slj_ipcba_gba_nacional: {
    file: "data/gba_slj_ipcba_gba_nacional.csv",
    label: "GBA → San Luis-Jujuy → CABA → GBA → Nacional",
    short: "Última serie base diciembre 2016=100",
    first: "1965-10", last: "2026-06",
    columns: ["Nivel general","Alimentos y bebidas no alcohólicas","Bebidas alcohólicas y tabaco","Prendas de vestir y calzado","Vivienda, agua, electricidad y otros combustibles","Equipamiento y manteni-miento del hogar","Salud","Transporte","Comunicaciones","Recreación y cultura","Educación","Restaurantes y hoteles","Otros bienes y servicios","Estacional","Núcleo","Regulados","Bienes","Servicios"],
    segments: [
      {to:"2006-12", label:"IPC GBA (INDEC) empalmado con series anteriores"},
      {to:"2012-07", label:"IPC promedio ponderado San Luis y Jujuy"},
      {to:"2016-04", label:"IPC CABA"},
      {to:"2016-12", label:"IPC GBA (INDEC)"},
      {to:"2026-06", label:"IPC Nacional (INDEC)"},
    ]
  },
  gba_sl_ipcba_gba: {
    file: "data/gba_sl_ipcba_gba.csv",
    label: "GBA → San Luis → CABA → GBA (sin salto a Nacional)",
    short: "Última serie base diciembre 2016=100",
    first: "1975-12", last: "2026-06",
    columns: ["Nivel general","Alimentos y bebidas no alcohólicas","Bebidas alcohólicas y tabaco","Prendas de vestir y calzado","Vivienda, agua, electricidad y otros combustibles","Equipa-miento y manteni-miento del hogar","Salud","Transporte","Comunicaciones","Recreación y cultura","Educación","Restaurantes y hoteles","Otros bienes y servicios","Estacional","Núcleo","Regulados","Bienes","Servicios"],
    segments: [
      {to:"2006-12", label:"IPC GBA (INDEC) empalmado con series anteriores"},
      {to:"2012-07", label:"IPC San Luis"},
      {to:"2016-04", label:"IPC CABA"},
      {to:"2026-06", label:"IPC GBA (INDEC)"},
    ]
  },
  gba_sl_ipcba_gba_nacional_nacional2021: {
    file: "data/gba_sl_ipcba_gba_nacional_nacional2021.csv",
    label: "GBA → San Luis → CABA → GBA → Nacional → Nacional 2021 (ENGHo, propia)",
    short: "Última serie base 2021=100",
    first: "1965-10", last: "2026-06",
    columns: ["Nivel general","Alimentos y bebidas no alcohólicas","Bebidas alcohólicas y tabaco","Prendas de vestir y calzado","Vivienda, agua, electricidad y otros combustibles","Equipamiento y manteni-miento del hogar","Salud","Transporte","Comunicaciones","Recreación y cultura","Educación","Restaurantes y hoteles","Otros bienes y servicios","Estacional","Núcleo","Regulados","Bienes","Servicios"],
    segments: [
      {to:"2006-12", label:"IPC GBA (INDEC) empalmado con series anteriores"},
      {to:"2012-07", label:"IPC San Luis"},
      {to:"2016-04", label:"IPC CABA"},
      {to:"2016-12", label:"IPC GBA (INDEC)"},
      {to:"2021-12", label:"IPC Nacional (INDEC)"},
      {to:"2026-06", label:"IPC Nacional base 2021=100, ponderadores ENGHo 17-18 (estimación propia)"},
    ]
  },
  gba_sl_ipcba12: {
    file: "data/gba_sl_ipcba12.csv",
    label: "GBA → San Luis → CABA — 12 divisiones (COICOP 1999)",
    short: "Última serie base 2021=100 empalmada con la anterior",
    first: "2001-12", last: "2026-06",
    columns: ["Nivel General","Alimentos y bebidas no alcohólicas","Bebidas alcohólicas y tabaco","Prendas de vestir y calzado","Vivienda, agua, electricidad, gas y otros combustibles","Equipamiento y mantenimiento del hogar","Salud","Transporte","Información y comunicación","Recreación y cultura","Educación","Restaurantes y hoteles","Otros bienes y servicios","Bienes","Servicios","Estacionales ","Regulados","Resto IPCBA"],
    segments: [
      {to:"2006-12", label:"IPC GBA (INDEC) empalmado con series anteriores"},
      {to:"2012-07", label:"IPC San Luis"},
      {to:"2026-06", label:"IPC CABA base 2021=100, empalmado, 12 divisiones"},
    ]
  },
  gba_sl_ipcba13: {
    file: "data/gba_sl_ipcba13.csv",
    label: "GBA → San Luis → CABA — 13 divisiones (COICOP 2018)",
    short: "Última serie base 2021=100 empalmada con la anterior",
    first: "2001-12", last: "2026-06",
    columns: ["Nivel General","Alimentos y bebidas no alcohólicas","Bebidas alcohólicas y tabaco","Prendas de vestir y calzado","Vivienda, agua, electricidad, gas y otros combustibles","Equipamiento y mantenimiento del hogar","Salud","Transporte","Información y comunicación","Recreación y cultura","Educación","Restaurantes y hoteles","Seguros y servicios financieros","Cuidado personal, protección social y otros productos","Bienes","Servicios","Estacionales ","Regulados","Resto IPCBA"],
    segments: [
      {to:"2006-12", label:"IPC GBA (INDEC) empalmado con series anteriores"},
      {to:"2012-07", label:"IPC San Luis"},
      {to:"2026-06", label:"IPC CABA base 2021=100, empalmado, 13 divisiones"},
    ]
  },
};

