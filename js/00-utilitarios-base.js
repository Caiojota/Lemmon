/* Funções usadas já na carga dos outros arquivos — por isso ficam primeiro. */
function normalizarTextoComparacao(s){
  return (s||"").toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
