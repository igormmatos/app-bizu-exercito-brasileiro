-- 006_seed_dev.sql
-- DEV ONLY: fake sample data for local/staging validation.
-- Avoid running in production.

begin;

insert into public.categories (id, name, sort_order, published, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'Manuais e Regulamentos', 1, true, '2024-02-01T11:00:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'Hinos e Cancoes', 2, true, '2023-01-01T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'Toques de Corneta', 3, true, '2023-01-01T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000004', 'Uniformes e Insignias', 4, true, '2024-01-01T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000005', 'Armamento e Tiro', 5, true, '2023-06-15T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000006', 'TFM e Saude', 6, true, '2024-01-10T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000007', 'Bizus de Campo', 7, false, '2024-01-10T00:00:00Z')
on conflict (id) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  published = excluded.published,
  updated_at = excluded.updated_at;

insert into public.items (
  id,
  title,
  description,
  type,
  category_id,
  tags,
  published,
  storage_path,
  text_body,
  updated_at
)
values
  -- Categoria 1: Manuais e Regulamentos
  (
    '00000000-0000-0000-0000-000000000101',
    'RISG - Regulamento Interno',
    'Regulamento Interno e dos Servicos Gerais (R-1). Atualizado.',
    'pdf',
    '00000000-0000-0000-0000-000000000001',
    array['manual', 'pdf', 'v2024', 'portaria-c-ex-1234', '4.5-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000101/risg-regulamento-interno.pdf',
    null,
    '2024-01-15T10:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'E-1 - Estatuto dos Militares',
    'Lei 6.880 - Direitos, deveres e prerrogativas.',
    'pdf',
    '00000000-0000-0000-0000-000000000001',
    array['manual', 'pdf', 'v2023', 'lei-6880', '2.1-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000102/e1-estatuto-dos-militares.pdf',
    null,
    '2023-12-10T09:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'R-Cont - Reg. de Continencias',
    'Sinais de respeito e cerimonial militar das Forcas Armadas.',
    'pdf',
    '00000000-0000-0000-0000-000000000001',
    array['manual', 'pdf', 'v2022', 'portaria-normativa', '3.0-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000103/r-cont-reg-continencias.pdf',
    null,
    '2023-05-20T14:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'RDE - Regulamento Disciplinar',
    'Transgressoes e punicoes disciplinares no ambito do EB.',
    'pdf',
    '00000000-0000-0000-0000-000000000001',
    array['manual', 'pdf', 'v2024', 'decreto-4346', '1.8-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000104/rde-regulamento-disciplinar.pdf',
    null,
    '2024-02-01T11:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'C 20-20 - TFM',
    'Manual de Campanha de Treinamento Fisico Militar.',
    'pdf',
    '00000000-0000-0000-0000-000000000001',
    array['manual', 'pdf', 'v2020', 'coter', '15-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000105/c20-20-tfm.pdf',
    null,
    '2023-01-15T08:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000106',
    'IG 10-60',
    'Instrucoes Gerais para Correspondencia do Exercito.',
    'pdf',
    '00000000-0000-0000-0000-000000000001',
    array['manual', 'pdf', 'v2021', 'sgex', '5.2-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000106/ig-10-60.pdf',
    null,
    '2023-08-11T16:20:00Z'
  ),

  -- Categoria 2: Hinos e Cancoes
  (
    '00000000-0000-0000-0000-000000000201',
    'Cancao do Exercito',
    'Nos somos da Patria a guarda...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '3.2-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000201/cancao-do-exercito.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'Fibra de Heroi',
    'Se a Patria querida for envolvida...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '4.0-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000202/fibra-de-heroi.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'Cancao da Infantaria',
    'Nos somos estes infantes...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '2.8-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000203/cancao-da-infantaria.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    'Cancao da Cavalaria',
    'Arma ligeira que transpoe os montes...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '3.1-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000204/cancao-da-cavalaria.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000205',
    'Cancao da Artilharia',
    'A Artilharia, a arma de Mallet...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '3.5-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000205/cancao-da-artilharia.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000206',
    'Cancao da Engenharia',
    'Gloria a ti, o castelo lendario...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '2.9-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000206/cancao-da-engenharia.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000207',
    'Cancao das Comunicacoes',
    'Pelo fio, pelo espaco...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '3.0-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000207/cancao-das-comunicacoes.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000208',
    'Cancao do Matibel',
    'Na paz e na guerra...',
    'audio',
    '00000000-0000-0000-0000-000000000002',
    array['audio', 'mp3', '3.3-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000208/cancao-do-matibel.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),

  -- Categoria 3: Toques de Corneta
  (
    '00000000-0000-0000-0000-000000000301',
    'Alvorada',
    'Toque de despertar.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.5-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000301/alvorada.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'Silencio',
    'Toque de recolher.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.8-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000302/silencio.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'Reunir',
    'Reuniao da tropa.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.4-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000303/reunir.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    'Sentido',
    'Posicao de respeito.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.2-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000304/sentido.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    'Descansar',
    'Posicao de descanso.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.2-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000305/descansar.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000306',
    'Avancar',
    'Comando de movimento.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.3-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000306/avancar.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000307',
    'Alto',
    'Cessar movimento.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.2-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000307/alto.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000308',
    'Rancho',
    'Horario das refeicoes.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.6-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000308/rancho.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000309',
    'Bandeira',
    'Hasteamento do pavilhao.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '1.2-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000309/bandeira.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000310',
    'Ordinario Marche',
    'Inicio de deslocamento.',
    'audio',
    '00000000-0000-0000-0000-000000000003',
    array['toque', 'padrao', '0.4-mb'],
    true,
    'audio/00000000-0000-0000-0000-000000000310/ordinario-marche.mp3',
    null,
    '2023-01-01T00:00:00Z'
  ),

  -- Categoria 4: Uniformes e Insignias
  (
    '00000000-0000-0000-0000-000000000401',
    'Insignia de Cabo',
    'Divisa de Cabo do Exercito.',
    'image',
    '00000000-0000-0000-0000-000000000004',
    array['image', 'rue', '0.2-mb', 'wikipedia-ref'],
    true,
    'image/00000000-0000-0000-0000-000000000401/insignia-cabo.png',
    null,
    '2024-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    'Insignia de 3o Sgt',
    'Divisa de Terceiro Sargento.',
    'image',
    '00000000-0000-0000-0000-000000000004',
    array['image', 'rue', '0.2-mb', 'wikipedia-ref'],
    true,
    'image/00000000-0000-0000-0000-000000000402/insignia-3o-sgt.png',
    null,
    '2024-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    'Uniforme 4o A1',
    'Uniforme de Servico com tunica.',
    'image',
    '00000000-0000-0000-0000-000000000004',
    array['image', 'rue', '1.5-mb'],
    true,
    'image/00000000-0000-0000-0000-000000000403/uniforme-4o-a1.jpg',
    null,
    '2024-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000404',
    'Uniforme 9o B2',
    'Camuflado operacional.',
    'image',
    '00000000-0000-0000-0000-000000000004',
    array['image', 'rue', '1.8-mb'],
    true,
    'image/00000000-0000-0000-0000-000000000404/uniforme-9o-b2.jpg',
    null,
    '2024-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000405',
    'Manual do Coturno',
    'Como engraxar e amarrar corretamente.',
    'pdf',
    '00000000-0000-0000-0000-000000000004',
    array['pdf', 'bizu', '0.5-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000405/manual-do-coturno.pdf',
    null,
    '2024-01-01T00:00:00Z'
  ),

  -- Categoria 5: Armamento e Tiro
  (
    '00000000-0000-0000-0000-000000000501',
    'Fuzil 7,62 M964 (FAL)',
    'Manual tecnico e desmontagem.',
    'pdf',
    '00000000-0000-0000-0000-000000000005',
    array['pdf', 'c-23-1', '5.0-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000501/fuzil-762-m964-fal.pdf',
    null,
    '2023-06-15T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000502',
    'Pistola 9mm M973',
    'Caracteristicas e funcionamento.',
    'pdf',
    '00000000-0000-0000-0000-000000000005',
    array['pdf', 'c-23-2', '3.0-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000502/pistola-9mm-m973.pdf',
    null,
    '2023-06-15T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000503',
    'Desmontagem de 1o Escalao',
    'Vista explodida do FAL.',
    'image',
    '00000000-0000-0000-0000-000000000005',
    array['image', 'img', '1.2-mb'],
    true,
    'image/00000000-0000-0000-0000-000000000503/desmontagem-1o-escalao.jpg',
    null,
    '2023-06-15T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000504',
    'Regras de Seguranca',
    'Seguranca no estande de tiro.',
    'pdf',
    '00000000-0000-0000-0000-000000000005',
    array['pdf', 'v1', '0.5-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000504/regras-de-seguranca.pdf',
    null,
    '2023-06-15T00:00:00Z'
  ),

  -- Categoria 6: TFM e Saude
  (
    '00000000-0000-0000-0000-000000000601',
    'Tabela de Indices TFM',
    'Indices para o TAF (Corrida, Flexao, Barra).',
    'pdf',
    '00000000-0000-0000-0000-000000000006',
    array['pdf', '2024', '0.3-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000601/tabela-de-indices-tfm.pdf',
    null,
    '2024-01-10T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    'Flexao de Braco',
    'Postura correta para execucao.',
    'image',
    '00000000-0000-0000-0000-000000000006',
    array['image', 'v1', '0.8-mb'],
    true,
    'image/00000000-0000-0000-0000-000000000602/flexao-de-braco.jpg',
    null,
    '2024-01-10T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000603',
    'Guia de Corrida',
    'Plano de treinamento aerobico.',
    'pdf',
    '00000000-0000-0000-0000-000000000006',
    array['pdf', 'v1', '1.1-mb'],
    true,
    'pdf/00000000-0000-0000-0000-000000000603/guia-de-corrida.pdf',
    null,
    '2024-01-10T00:00:00Z'
  ),

  -- Categoria 7: Bizus de Campo (draft)
  (
    '00000000-0000-0000-0000-000000000701',
    'Nos e Amarracoes',
    'Guia rapido de nos.',
    'text',
    '00000000-0000-0000-0000-000000000007',
    array['text', 'v1', 'draft'],
    false,
    null,
    'Guia rapido de nos e amarracoes para atividades de campo.',
    '2024-01-10T00:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000702',
    'Oracao do Combatente',
    'Texto motivacional.',
    'text',
    '00000000-0000-0000-0000-000000000007',
    array['text', 'v1', 'draft'],
    false,
    null,
    'Texto motivacional de referencia para leitura interna.',
    '2024-01-10T00:00:00Z'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  type = excluded.type,
  category_id = excluded.category_id,
  tags = excluded.tags,
  published = excluded.published,
  storage_path = excluded.storage_path,
  text_body = excluded.text_body,
  updated_at = excluded.updated_at;

commit;
