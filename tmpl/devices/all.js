import { createVnsTable, registerReload  } from '../../js/commons/tables.js';
import { post } from '../../js/commons/net.js';

export async function init() {
  try {
    const json = await post('devices', 'lists');
    const { cams = [], iot = [], other = [] } = json?.data?.data;

    await createVnsTable('table-cams', { data: cams,  dateFields:['last_check']  });
    await createVnsTable('table-iot',   { data: iot,  dateFields:['last_check']  });
    await createVnsTable('table-others', { data: other,  dateFields:['last_check'] });

  } catch (err) {
    console.error('Caricamento dati tabelle fallito:', err);
    await createVnsTable('#table-cams', {
      columns:[{ title:'Errore', field:'error' }],
      data:[{ error:String(err?.message || err) }]
    });
  }
}

registerReload(init);