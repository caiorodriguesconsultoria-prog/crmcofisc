-- Estende o fluxo de "reposição" que já existia só pra avaria também pro
-- desvio de qualidade — pedido do Caio: um botão pra "concluir" a entrega
-- com desvio de qualidade, igual já existe pra avaria (lançamento filho
-- referenciando o lançamento pai, em vez de só um campo booleano "resolvido"
-- — mantém o histórico real de quando/como foi reposto).

alter table processo_entrega_lancamentos
  drop constraint processo_entrega_lancamentos_tipo_check,
  drop constraint chk_avaria_tem_pai,
  drop constraint chk_avaria_tem_prazo;

alter table processo_entrega_lancamentos
  add constraint processo_entrega_lancamentos_tipo_check
    check (tipo in ('total', 'parcial', 'avaria', 'desvio')),
  add constraint chk_reposicao_tem_pai
    check (tipo not in ('avaria', 'desvio') or lancamento_pai_id is not null),
  add constraint chk_reposicao_tem_prazo
    check (tipo not in ('avaria', 'desvio') or data_limite is not null);
