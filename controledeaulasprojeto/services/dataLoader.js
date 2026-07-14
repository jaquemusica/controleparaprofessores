// ============================================================
// Carregamento inicial de todos os dados do professor logado.
// ============================================================
import { store } from '../utils/store.js';
import { fetchStudents } from './studentsService.js';
import { fetchPackages } from './packagesService.js';
import { fetchLessons } from './lessonsService.js';
import { fetchAvailability } from './availabilityService.js';
import { fetchBookingRequests } from './bookingService.js';

export async function loadAll(){
  try{
    const [students, packages, lessons, availability, bookingRequests] = await Promise.all([
      fetchStudents(), fetchPackages(), fetchLessons(), fetchAvailability(), fetchBookingRequests(),
    ]);
    store.students = students;
    store.packages = packages;
    store.lessons = lessons;
    store.availability = availability;
    store.bookingRequests = bookingRequests;
    store.state.dbError = null;
  }catch(e){
    console.error(e);
    store.state.dbError = e.message || 'Não foi possível conectar ao banco de dados.';
  }
  store.state.loading = false;
}
