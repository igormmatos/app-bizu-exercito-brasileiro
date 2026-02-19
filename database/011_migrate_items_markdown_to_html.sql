-- 011_migrate_items_markdown_to_html.sql
-- Convert legacy markdown/plain text in items.text_body to simple HTML.

create or replace function public.markdown_to_simple_html(input_text text)
returns text
language plpgsql
as $$
declare
  normalized text;
  lines text[];
  line text;
  processed text;
  paragraph text := '';
  html text := '';
  in_list boolean := false;
  idx integer;
begin
  if input_text is null then
    return null;
  end if;

  normalized := replace(replace(input_text, E'\r\n', E'\n'), E'\r', E'\n');
  normalized := btrim(normalized);

  if normalized = '' then
    return input_text;
  end if;

  -- Already-HTML content should be preserved as-is.
  if normalized ~ '<\s*/?\s*[a-zA-Z][^>]*>' then
    return input_text;
  end if;

  lines := string_to_array(normalized, E'\n');

  if lines is null or array_length(lines, 1) is null then
    return '<p>' || normalized || '</p>';
  end if;

  for idx in array_lower(lines, 1)..array_upper(lines, 1) loop
    line := coalesce(lines[idx], '');

    if btrim(line) = '' then
      if paragraph <> '' then
        html := html || '<p>' || paragraph || '</p>';
        paragraph := '';
      end if;
      if in_list then
        html := html || '</ul>';
        in_list := false;
      end if;
      continue;
    end if;

    processed := btrim(line);
    processed := regexp_replace(processed, '\[(.*?)\]\((https?://[^\s)]+)\)', '<a href="\2">\1</a>', 'g');
    processed := regexp_replace(processed, '\*\*(.+?)\*\*', '<strong>\1</strong>', 'g');
    processed := regexp_replace(processed, '\*(.+?)\*', '<em>\1</em>', 'g');

    if processed ~ '^-\\s+' then
      if paragraph <> '' then
        html := html || '<p>' || paragraph || '</p>';
        paragraph := '';
      end if;
      if not in_list then
        html := html || '<ul>';
        in_list := true;
      end if;
      processed := regexp_replace(processed, '^-\\s+', '', 'g');
      html := html || '<li>' || processed || '</li>';
      continue;
    end if;

    if in_list then
      html := html || '</ul>';
      in_list := false;
    end if;

    if paragraph = '' then
      paragraph := processed;
    else
      paragraph := paragraph || '<br />' || processed;
    end if;
  end loop;

  if paragraph <> '' then
    html := html || '<p>' || paragraph || '</p>';
  end if;

  if in_list then
    html := html || '</ul>';
  end if;

  return case when html = '' then input_text else html end;
end;
$$;

with converted as (
  select
    id,
    public.markdown_to_simple_html(text_body) as next_text_body
  from public.items
  where type in ('text', 'image')
    and text_body is not null
    and nullif(btrim(text_body), '') is not null
)
update public.items as target
set text_body = converted.next_text_body
from converted
where target.id = converted.id
  and target.text_body is distinct from converted.next_text_body;

drop function if exists public.markdown_to_simple_html(text);
