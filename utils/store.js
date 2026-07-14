// ============================================================
// Estado global compartilhado da aplicação (SPA em módulos ES).
// Um único objeto mutável importado por todos os módulos, para
// que inserções/remoções em arrays (push/splice) sejam vistas
// por todo mundo sem precisar de um sistema de eventos.
// ============================================================
export const store = {
  students: [],
  packages: [],
  lessons: [],
  availability: [],
  bookingRequests: [],
  session: null,   // sessão do Supabase Auth (definida na Etapa 2)
  profile: null,   // perfil do professor logado (definido na Etapa 2)
  subscription: null, // status da assinatura (definido na Etapa 5)

  state: {
    view: 'dashboard',
    selectedStudentId: null,
    studentTab: 'pacotes',
    agendaWeekStart: null,
    agendaViewMode: 'semana',
    agendaMonth: (new Date()).getMonth(),
    agendaYear: (new Date()).getFullYear(),
    financeMonth: (new Date()).getMonth(),
    financeYear: (new Date()).getFullYear(),
    studentSearch: '',
    loading: true,
    dbError: null,
  },
};
