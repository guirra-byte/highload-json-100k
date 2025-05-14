export type UpcomingPayloadProps = {
  id: string;
  nome: string;
  idade: number;
  score: number;
  ativo: boolean;
  pais: string;
  equipe: EquipeProps;
  logs: LogProps[];
};

type EquipeProps = {
  nome: string;
  lider: boolean;
  projetos: [{ nome: string; concluido: boolean }];
};

type LogProps = { data: string; acao: string };
