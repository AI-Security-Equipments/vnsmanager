import { createVnsTable } from '../../js/commons/tables.js';
import { post } from '../../js/commons/net.js';

export async function init() {
    debugger;
  try {
    const json = await post('devices', 'lists');
    const { cams = [], iot = [], other = [] } = json?.data;

    await createVnsTable('#table-cams', { data: cams });
    await createVnsTable('#table-iot',   { data: iot });
    await createVnsTable('#table-other', { data: other});

  } catch (err) {
    console.error('Caricamento dati tabelle fallito:', err);
    await createVnsTable('#table-cams', {
      columns:[{ title:'Errore', field:'error' }],
      data:[{ error:String(err?.message || err) }]
    });
  }
}