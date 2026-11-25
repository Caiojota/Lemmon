/* =====================================================================
   DADOS DAS NORMAS REGULAMENTADORAS (NRs)
   Usado pelos módulos "Multas NR" e "NR Explicada".
   NR_DADOS: conteúdo explicativo de cada NR (item por item), pesquisado e
   parafraseado a partir do texto oficial (gov.br/trabalho-e-emprego) e de
   fontes jurídicas secundárias confiáveis.
   MULTAS_DADOS: tabela de penalidades usada pela calculadora de multas,
   com base na NR-28 (Fiscalização e Penalidades) e nas portarias que a
   atualizam. Alguns valores são estimativas calculadas (não copiadas de
   fonte oficial publicada) — ver o campo "incertezasEAvisos" abaixo e o
   aviso fixo exibido na tela da calculadora.
   ===================================================================== */

const NR_DADOS = {
  "NR-1": {
    "titulo": "Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
    "status": "ativa",
    "resumo": "A NR-1 é a norma 'guarda-chuva' do sistema: ela define termos comuns usados em todas as outras NRs, diz a quem elas se aplicam (empregadores e trabalhadores urbanos e rurais, inclusive órgãos públicos com empregados CLT) e estabelece como a empresa deve gerenciar riscos ocupacionais no dia a dia, por meio do PGR (Programa de Gerenciamento de Riscos). Ela organiza direitos e deveres de empregador e trabalhador, a ordem de prioridade das medidas de proteção, e regras sobre treinamento, documentação digital e tratamento diferenciado para microempresas e pequenos negócios.",
    "itens": [
      {
        "numero": "1.1-1.2",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "Define que a norma estabelece conceitos e regras gerais válidas para todas as NRs, e que se aplica a empresas e órgãos públicos com empregados regidos pela CLT, tanto na cidade quanto no campo. Ela não substitui exigências de posturas municipais, normas sanitárias ou acordos coletivos — é um piso mínimo."
      },
      {
        "numero": "1.3",
        "titulo": "Quem fiscaliza",
        "explicacao": "A Secretaria de Trabalho, por meio da Inspeção do Trabalho (auditores fiscais), é quem define diretrizes nacionais, fiscaliza o cumprimento das NRs e julga recursos. As superintendências regionais aplicam as multas."
      },
      {
        "numero": "1.4.1",
        "titulo": "Deveres do empregador",
        "explicacao": "A empresa precisa cumprir as NRs, avisar os trabalhadores sobre os riscos do trabalho e os resultados de exames, emitir ordens de serviço e definir como agir em caso de acidente. Na hora de proteger o trabalhador, a ordem de prioridade é: primeiro eliminar o risco, depois usar proteção coletiva, depois medidas administrativas, e só por último o EPI."
      },
      {
        "numero": "1.4.2",
        "titulo": "Deveres do trabalhador",
        "explicacao": "O empregado deve seguir as normas e ordens de serviço, comparecer aos exames exigidos, colaborar com a empresa e usar o EPI fornecido. Recusar-se a isso sem justificativa pode ser considerado falta grave."
      },
      {
        "numero": "1.4.3",
        "titulo": "Direito de recusa diante de risco grave e iminente",
        "explicacao": "O trabalhador pode interromper uma atividade se perceber risco grave e iminente à sua vida ou saúde, desde que avise imediatamente o superior. Ele não pode ser prejudicado por isso, e só volta a trabalhar depois que o problema for corrigido."
      },
      {
        "numero": "1.5.3",
        "titulo": "PGR por estabelecimento",
        "explicacao": "Toda empresa deve ter um Programa de Gerenciamento de Riscos (PGR) para cada local de trabalho, cobrindo riscos físicos, químicos, biológicos, de acidentes, ergonômicos e até psicossociais (como estresse e assédio). Os trabalhadores precisam ser consultados e informados sobre o programa."
      },
      {
        "numero": "1.5.4",
        "titulo": "Inventário de riscos",
        "explicacao": "É o levantamento de todos os perigos existentes no trabalho, feito antes de iniciar uma atividade nova e revisado a cada mudança relevante ou, no mínimo, a cada dois anos. Para cada risco, a empresa classifica a gravidade e a probabilidade de acontecer."
      },
      {
        "numero": "1.5.5",
        "titulo": "Plano de ação",
        "explicacao": "É o documento que lista as medidas de prevenção que a empresa vai tomar, com prazos, responsáveis e acompanhamento dos resultados. Riscos que afetam mais trabalhadores têm prioridade mais alta."
      },
      {
        "numero": "1.5.6",
        "titulo": "Preparação para emergências",
        "explicacao": "A empresa deve ter procedimentos prontos para emergências, como primeiros socorros, transporte de acidentados e evacuação do local, com treinos simulados e registro dessas ações."
      },
      {
        "numero": "1.5.7",
        "titulo": "Documentação do PGR",
        "explicacao": "O PGR precisa ter pelo menos o inventário de riscos e o plano de ação, datados, assinados e disponíveis para os trabalhadores, sindicato e fiscalização. O histórico do inventário deve ser guardado por 20 anos."
      },
      {
        "numero": "1.5.8",
        "titulo": "Empresas terceirizadas",
        "explicacao": "Quando há terceirização, a contratante e a contratada precisam trocar informações sobre riscos e, se os riscos se misturarem no mesmo local, definir juntas as medidas de proteção, sob coordenação da contratada."
      },
      {
        "numero": "1.7",
        "titulo": "Treinamentos",
        "explicacao": "Define três tipos de treinamento: inicial (antes de começar a trabalhar), periódico (repetido de tempos em tempos) e eventual (quando mudam os riscos ou após acidente grave). O tempo de treinamento conta como hora trabalhada, e pode ser feito a distância em alguns casos."
      },
      {
        "numero": "1.8",
        "titulo": "Tratamento para pequenos negócios",
        "explicacao": "MEI (microempreendedor individual) fica dispensado do PGR. Microempresas e pequenas empresas de baixo risco (graus 1 e 2) também podem ficar dispensadas do PGR e até do PCMSO se não tiverem exposição a riscos físicos, químicos, biológicos ou ergonômicos relevantes — mas os exames médicos continuam obrigatórios."
      }
    ]
  },
  "NR-2": {
    "titulo": "Inspeção Prévia",
    "status": "revogada",
    "observacao": "A NR-2 foi revogada integralmente pela Portaria SEPRT nº 915, de 30 de julho de 2019, dentro do pacote de modernização das Normas Regulamentadoras feito naquele ano. Não há conteúdo técnico vigente para esta norma."
  },
  "NR-3": {
    "titulo": "Embargo e Interdição",
    "status": "ativa",
    "resumo": "A NR-3 regula duas medidas administrativas que a Inspeção do Trabalho pode aplicar quando encontra risco muito alto: o embargo (paralisação de uma obra, atividade ou setor) e a interdição (interdição de máquina, equipamento ou estabelecimento inteiro). Não são punições à empresa, e sim medidas cautelares para evitar acidente grave ou doença ocupacional. A norma foi revisada em 2019 para dar critérios técnicos mais objetivos aos auditores fiscais na hora de decidir.",
    "itens": [
      {
        "numero": "3.1",
        "titulo": "Natureza da medida",
        "explicacao": "Embargo e interdição têm caráter cautelar: servem para proteger a vida e a saúde do trabalhador, não para punir a empresa. Isso é diferente de uma multa."
      },
      {
        "numero": "3.2",
        "titulo": "Quem aplica e quando",
        "explicacao": "O Auditor-Fiscal do Trabalho é quem decide aplicar embargo ou interdição, quando o excesso de risco encontrado é classificado como 'Extremo' ou 'Substancial', numa escala que vai até 'Nenhum'."
      },
      {
        "numero": "3.3",
        "titulo": "Como o risco é calculado",
        "explicacao": "O auditor compara o 'risco atual' (como a empresa realmente está trabalhando) com o 'risco de referência' (como ela deveria estar, cumprindo a lei). Quanto maior a diferença entre os dois, maior o excesso de risco e mais provável a aplicação da medida."
      },
      {
        "numero": "3.4",
        "titulo": "Grave e iminente risco (GIR)",
        "explicacao": "É uma situação separada, tratada em outras NRs, onde o perigo é tão evidente e imediato que o trabalhador pode até se recusar a trabalhar sozinho, sem precisar esperar a fiscalização."
      },
      {
        "numero": "3.5",
        "titulo": "Consequência prática para a empresa",
        "explicacao": "Enquanto durar o embargo ou a interdição, a atividade, máquina ou local fica proibido de funcionar até que as irregularidades sejam corrigidas e a liberação seja confirmada pela fiscalização."
      }
    ]
  },
  "NR-4": {
    "titulo": "Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho (SESMT)",
    "status": "ativa",
    "resumo": "A NR-4 obriga empresas de determinado porte e grau de risco a montar uma equipe própria de segurança e saúde no trabalho — o SESMT —, formada por profissionais como engenheiro de segurança, médico do trabalho, enfermeiro e técnico de segurança. O tamanho dessa equipe depende do número de empregados e do grau de risco da atividade da empresa. A norma também define como o SESMT deve atuar no dia a dia, em conjunto com o PGR (NR-1), o PCMSO (NR-7) e a CIPA (NR-5).",
    "itens": [
      {
        "numero": "4.1/4.5",
        "titulo": "Quem precisa ter SESMT e como se calcula",
        "explicacao": "A obrigatoriedade e o tamanho da equipe dependem de dois fatores: quantos empregados a empresa tem e qual é o grau de risco (1 a 4) da atividade principal ou da atividade que ocupa mais trabalhadores no estabelecimento. Microempresas de baixo risco contam apenas metade dos trabalhadores nesse cálculo."
      },
      {
        "numero": "4.2",
        "titulo": "Modalidades de SESMT",
        "explicacao": "O SESMT pode ser individual (um serviço só para a empresa), regionalizado (atende vários estabelecimentos), estadual (soma trabalhadores do mesmo estado) ou compartilhado (entre empresas do mesmo ramo e região)."
      },
      {
        "numero": "4.3",
        "titulo": "Composição da equipe",
        "explicacao": "Pode incluir médico do trabalho, engenheiro de segurança, técnico de segurança, enfermeiro e auxiliar de enfermagem do trabalho, cada um com formação e registro profissional exigidos por lei. Um deles coordena a equipe."
      },
      {
        "numero": "4.3.1",
        "titulo": "O que o SESMT faz na prática",
        "explicacao": "Participa da identificação de riscos e do plano de ação do PGR, orienta a empresa sobre o cumprimento das NRs, acompanha o PCMSO, investiga acidentes e doenças do trabalho, e pode até propor a paralisação imediata de uma atividade em caso de risco grave."
      },
      {
        "numero": "4.6",
        "titulo": "Registro e documentação",
        "explicacao": "A empresa deve registrar o SESMT em sistema eletrônico do governo, mantendo atualizados os dados dos profissionais, o grau de risco e o número de trabalhadores atendidos."
      },
      {
        "numero": "4.9",
        "titulo": "Responsabilidade do empregador",
        "explicacao": "Cabe à empresa constituir e manter o SESMT na modalidade correta, garantir recursos para o trabalho da equipe e indicar, entre os médicos do SESMT, o responsável pelo PCMSO."
      }
    ]
  },
  "NR-5": {
    "titulo": "Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA)",
    "status": "ativa",
    "resumo": "A NR-5 cria a CIPA, uma comissão formada por representantes da empresa e dos próprios trabalhadores, eleitos democraticamente, com a missão de prevenir acidentes e doenças do trabalho e, desde a atualização mais recente, também prevenir assédio e outras formas de violência no ambiente de trabalho. O tamanho e a obrigatoriedade da CIPA dependem do número de empregados e do grau de risco da empresa. A norma detalha o processo eleitoral, o mandato dos membros, a estabilidade no emprego e as reuniões periódicas.",
    "itens": [
      {
        "numero": "5.1",
        "titulo": "Quem precisa ter CIPA",
        "explicacao": "Empresas e órgãos públicos com empregados CLT, conforme o Quadro I (que cruza número de funcionários com grau de risco). Estabelecimentos pequenos demais para ter CIPA formal designam um representante para cumprir os objetivos da norma."
      },
      {
        "numero": "5.2",
        "titulo": "Composição",
        "explicacao": "Metade da comissão é indicada pela empresa e a outra metade é eleita pelos próprios trabalhadores, por voto secreto. O presidente é escolhido pela empresa, e o vice-presidente, pelos representantes eleitos dos empregados."
      },
      {
        "numero": "5.3",
        "titulo": "Processo eleitoral",
        "explicacao": "A empresa precisa convocar a eleição com pelo menos 60 dias de antecedência do fim do mandato anterior, divulgar edital, abrir inscrições por no mínimo 15 dias e votar com urna secreta, garantindo participação mínima dos trabalhadores."
      },
      {
        "numero": "5.4",
        "titulo": "Mandato e estabilidade",
        "explicacao": "O mandato dura 1 ano, com direito a uma reeleição. O trabalhador eleito tem estabilidade no emprego desde a candidatura até um ano após o fim do mandato, não podendo ser demitido sem justa causa nesse período."
      },
      {
        "numero": "5.5",
        "titulo": "Reuniões e funcionamento",
        "explicacao": "A CIPA se reúne pelo menos uma vez por mês (ou a cada dois meses em pequenas empresas de baixo risco), além de reuniões extras após acidentes graves. As decisões e atas devem ser divulgadas a todos os empregados."
      },
      {
        "numero": "5.6",
        "titulo": "Principais atribuições",
        "explicacao": "Acompanhar a identificação de riscos e as medidas de prevenção, inspecionar os ambientes de trabalho, investigar acidentes, organizar a SIPAT (Semana Interna de Prevenção de Acidentes) e, agora, também tratar da prevenção ao assédio sexual e à violência no trabalho."
      },
      {
        "numero": "5.7",
        "titulo": "Treinamento dos membros",
        "explicacao": "Antes de tomar posse, os membros da CIPA precisam de treinamento, com carga horária que varia de 8 a 20 horas conforme o grau de risco da empresa, cobrindo temas como prevenção de acidentes, legislação e também combate ao assédio."
      }
    ]
  },
  "NR-6": {
    "titulo": "Equipamento de Proteção Individual (EPI)",
    "status": "ativa",
    "resumo": "A NR-6 trata do uso de EPI — qualquer equipamento usado individualmente pelo trabalhador para se proteger de riscos no trabalho, como capacete, luvas, óculos de proteção ou cinto de segurança. A norma deixa claro que o EPI é a última linha de defesa, usado só quando não é possível eliminar o risco ou proteger o trabalhador coletivamente. Ela define as obrigações da empresa e do trabalhador, além das regras sobre o Certificado de Aprovação (CA), documento que garante que o equipamento é confiável.",
    "itens": [
      {
        "numero": "6.1",
        "titulo": "Definição de EPI",
        "explicacao": "É todo dispositivo de uso individual, destinado a proteger o trabalhador contra riscos que possam ameaçar sua segurança e saúde no trabalho. Os tipos aprovados estão organizados por parte do corpo protegida (cabeça, olhos, audição, respiração etc.) no Anexo I da norma."
      },
      {
        "numero": "6.5",
        "titulo": "Responsabilidades do empregador",
        "explicacao": "A empresa deve comprar apenas EPI com Certificado de Aprovação, treinar o trabalhador sobre o uso correto, fornecer o equipamento gratuitamente, registrar a entrega, exigir o uso, cuidar da higienização e trocar imediatamente qualquer EPI danificado ou perdido."
      },
      {
        "numero": "6.6",
        "titulo": "Responsabilidades do trabalhador",
        "explicacao": "O empregado deve usar o EPI fornecido, apenas para a finalidade indicada, cuidar da sua limpeza e conservação, e avisar a empresa se o equipamento for perdido, danificado ou ficar impróprio para uso."
      },
      {
        "numero": "6.9",
        "titulo": "Certificado de Aprovação (CA)",
        "explicacao": "Nenhum EPI pode ser vendido ou usado sem CA válido, que é o documento emitido pelo governo atestando que o equipamento realmente protege contra o risco para o qual foi projetado. O número do CA, o fabricante e o lote precisam estar marcados de forma visível no próprio equipamento."
      },
      {
        "numero": "6.2",
        "titulo": "Prioridade das medidas de proteção",
        "explicacao": "O EPI só deve ser usado quando a eliminação do risco ou a proteção coletiva não forem suficientes ou viáveis — ele é o último recurso na hierarquia de prevenção, nunca o primeiro."
      }
    ]
  },
  "NR-7": {
    "titulo": "Programa de Controle Médico de Saúde Ocupacional (PCMSO)",
    "status": "ativa",
    "resumo": "A NR-7 exige que toda empresa com empregados CLT tenha um programa de acompanhamento da saúde dos trabalhadores, coordenado por um médico do trabalho, com base nos riscos identificados no PGR (NR-1). O PCMSO organiza os exames médicos obrigatórios ao longo da relação de trabalho — da contratação até o desligamento — e gera documentos que comprovam a condição de saúde do trabalhador em relação ao trabalho que exerce.",
    "itens": [
      {
        "numero": "7.1",
        "titulo": "Objetivo e responsabilidade",
        "explicacao": "Proteger a saúde do trabalhador em relação aos riscos do seu trabalho. A empresa deve custear integralmente o programa e indicar um médico do trabalho responsável por ele."
      },
      {
        "numero": "7.2",
        "titulo": "Exames obrigatórios",
        "explicacao": "Existem cinco tipos de exame: admissional (antes de começar a trabalhar), periódico (anual para quem tem exposição a risco, ou a cada dois anos para os demais), de retorno ao trabalho (após afastamento de 30 dias ou mais), de mudança de função e demissional (até 10 dias após o fim do contrato)."
      },
      {
        "numero": "7.3",
        "titulo": "ASO (Atestado de Saúde Ocupacional)",
        "explicacao": "É o documento emitido a cada exame, que diz se o trabalhador está apto ou inapto para a função, com os riscos a que está exposto, os exames feitos e os dados do médico responsável."
      },
      {
        "numero": "7.4",
        "titulo": "Relação com o PGR",
        "explicacao": "O PCMSO deve ser montado a partir dos riscos já identificados no inventário de riscos do PGR (NR-1). Se o médico perceber alguma inconsistência nesse inventário, ele deve conversar com os responsáveis pelo PGR para corrigir."
      },
      {
        "numero": "7.5",
        "titulo": "Guarda de documentos",
        "explicacao": "O prontuário médico de cada trabalhador precisa ser guardado por pelo menos 20 anos após o desligamento — e por prazos ainda maiores (até 40 anos) em casos de exposição a substâncias cancerígenas ou radiação."
      }
    ]
  },
  "NR-8": {
    "titulo": "Edificações",
    "status": "ativa",
    "resumo": "A NR-8 estabelece requisitos técnicos mínimos que os prédios e locais de trabalho precisam cumprir para garantir segurança e conforto aos trabalhadores. Ela trata, de forma mais genérica, de pisos, tetos, paredes externas, proteção contra quedas e contra intempéries (chuva, calor, umidade), deixando os detalhes técnicos mais específicos para normas técnicas (ABNT) e posturas municipais.",
    "itens": [
      {
        "numero": "8.1-8.2",
        "titulo": "Objetivo e aplicação",
        "explicacao": "A norma vale para qualquer edificação onde exista atividade de trabalho, com o objetivo de garantir segurança e conforto, sem entrar em conflito com o código de obras local."
      },
      {
        "numero": "8.3.1",
        "titulo": "Pé-direito",
        "explicacao": "A altura entre o piso e o teto deve seguir o código de obras do município e as normas técnicas aplicáveis — não existe um valor único fixado na própria NR-8."
      },
      {
        "numero": "8.3.2",
        "titulo": "Pisos e circulação",
        "explicacao": "Os pisos não podem ter buracos ou saliências que atrapalhem a circulação, precisam suportar o peso de pessoas e materiais, e em áreas de risco de escorregão devem usar material antiderrapante. Aberturas no piso ou na parede precisam de proteção contra queda."
      },
      {
        "numero": "8.3.2.5",
        "titulo": "Proteção em andares altos",
        "explicacao": "Edificações com mais de um andar precisam de proteção contra queda de pessoas ou de objetos, seguindo a legislação do município e as normas técnicas."
      },
      {
        "numero": "8.3.3",
        "titulo": "Proteção contra intempéries",
        "explicacao": "Paredes externas e coberturas precisam proteger contra chuva, calor excessivo e umidade, e seguir normas técnicas de resistência ao fogo e isolamento térmico e acústico."
      }
    ]
  },
  "NR-9": {
    "titulo": "Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos",
    "status": "ativa",
    "resumo": "A NR-9 detalha como a empresa deve avaliar, na prática, a exposição dos trabalhadores a agentes físicos (ruído, calor, vibração etc.), químicos (poeiras, vapores, gases) e biológicos (vírus, bactérias, fungos) identificados no PGR (NR-1). Ela complementa a NR-1 com metodologia técnica: como medir, comparar com limites de exposição e decidir que medidas de controle adotar, alimentando o inventário de riscos e o plano de ação.",
    "itens": [
      {
        "numero": "9.1",
        "titulo": "Objetivo",
        "explicacao": "Dar o passo a passo técnico para avaliar exposições ocupacionais já identificadas no PGR, servindo de base para as medidas de prevenção que a empresa vai adotar."
      },
      {
        "numero": "9.2",
        "titulo": "Identificação das exposições",
        "explicacao": "Para cada risco, a empresa precisa descrever a atividade, o agente envolvido, a forma de exposição, os possíveis danos à saúde, os fatores que influenciam a exposição e quais grupos de trabalhadores estão expostos."
      },
      {
        "numero": "9.3",
        "titulo": "Avaliação preliminar, qualitativa e quantitativa",
        "explicacao": "Primeiro se faz uma análise simples para decidir se já dá para agir direto ou se é preciso medir com mais precisão. A avaliação quantitativa (com instrumentos de medição) serve para confirmar se a exposição está dentro do limite seguro."
      },
      {
        "numero": "9.4",
        "titulo": "Limites de exposição e nível de ação",
        "explicacao": "Cada agente tem um limite de tolerância (definido na NR-15, quando aplicável) e um 'nível de ação', que normalmente é metade desse limite. Ao ultrapassar o nível de ação, a empresa já precisa agir preventivamente, antes mesmo de chegar ao limite máximo."
      },
      {
        "numero": "9.5",
        "titulo": "Integração com o PGR",
        "explicacao": "Os resultados das avaliações entram no inventário de riscos e no plano de ação do PGR (NR-1), e também ajudam o médico do PCMSO (NR-7) a decidir que exames e monitoramento de saúde são necessários."
      }
    ]
  },
  "NR-10": {
    "titulo": "Segurança em Instalações e Serviços em Eletricidade",
    "status": "ativa",
    "resumo": "A NR-10 estabelece os requisitos mínimos para garantir a segurança de quem trabalha com eletricidade ou perto dela — desde o projeto das instalações elétricas até a operação e manutenção. A norma dá prioridade à desenergização como principal medida de proteção, define distâncias de segurança perto de partes energizadas, exige documentação técnica detalhada (o Prontuário de Instalações Elétricas) e estabelece quem pode trabalhar com eletricidade, com que nível de qualificação e treinamento.",
    "itens": [
      {
        "numero": "10.1",
        "titulo": "Prioridade das medidas de controle",
        "explicacao": "Sempre que possível, a instalação deve ser desenergizada antes do trabalho. Se isso não for viável, usam-se outras medidas coletivas, como isolamento, barreiras e sinalização, e só depois o EPI individual."
      },
      {
        "numero": "10.2",
        "titulo": "Desenergização",
        "explicacao": "Para considerar uma instalação realmente desenergizada, é preciso seguir uma sequência obrigatória: desligar, impedir religamento, confirmar ausência de tensão, aterrar e sinalizar. Pular etapas é um dos erros mais perigosos nesse tipo de trabalho."
      },
      {
        "numero": "10.3",
        "titulo": "Zonas de risco e zona controlada",
        "explicacao": "A norma define áreas ao redor de partes energizadas onde só trabalhadores autorizados podem entrar, com distâncias mínimas que variam conforme a voltagem da instalação."
      },
      {
        "numero": "10.4",
        "titulo": "Prontuário de Instalações Elétricas",
        "explicacao": "Obrigatório para estabelecimentos com carga instalada acima de 75 kW, reúne diagramas elétricos, procedimentos de segurança, registros de inspeção, comprovantes de treinamento dos trabalhadores e laudos de equipamentos de proteção."
      },
      {
        "numero": "10.5",
        "titulo": "Qualificação, capacitação e autorização",
        "explicacao": "A norma distingue quem tem curso técnico na área (qualificado), quem tem registro no conselho profissional (habilitado), quem recebeu treinamento interno da empresa (capacitado) e quem a empresa formalmente autoriza a trabalhar com eletricidade (autorizado)."
      },
      {
        "numero": "10.6",
        "titulo": "Treinamento e reciclagem",
        "explicacao": "Trabalhadores que atuam com eletricidade precisam de curso básico de no mínimo 40 horas, e a reciclagem é obrigatória a cada dois anos, ou antes disso em caso de mudança de função, afastamento longo ou mudança significativa nas instalações."
      }
    ]
  },
  "NR-11": {
    "titulo": "Transporte, Movimentação, Armazenagem e Manuseio de Materiais",
    "status": "ativa",
    "resumo": "A NR-11 trata da segurança no transporte de cargas — tanto manual (carregado pelo próprio trabalhador) quanto mecanizado (empilhadeiras, guindastes, elevadores, esteiras) — e da armazenagem correta de materiais em depósitos e almoxarifados. Ela busca evitar acidentes como quedas de carga, esmagamentos e lesões por esforço excessivo, e exige treinamento específico para quem opera equipamentos motorizados de movimentação de carga.",
    "itens": [
      {
        "numero": "11.1",
        "titulo": "Elevadores, guindastes e equipamentos motorizados",
        "explicacao": "Exige manutenção constante de cabos, correntes e roldanas, indicação visível da carga máxima permitida, proteção em poços de elevadores e proibição de motores a combustão em ambientes fechados sem ventilação adequada."
      },
      {
        "numero": "11.2",
        "titulo": "Transporte manual de sacos",
        "explicacao": "Limita a 60 metros a distância que um trabalhador pode carregar um saco sozinho; acima disso, é obrigatório usar carrinho, carreta ou equipamento mecanizado. Também regula escadas e pranchas usadas nesse transporte."
      },
      {
        "numero": "11.3",
        "titulo": "Armazenagem",
        "explicacao": "O material armazenado não pode exceder a capacidade de carga do piso, não pode bloquear saídas de emergência nem equipamentos de combate a incêndio, e as pilhas precisam ficar afastadas das paredes."
      },
      {
        "numero": "11.4",
        "titulo": "Treinamento de operadores",
        "explicacao": "Quem opera equipamento motorizado de movimentação de carga precisa de treinamento específico fornecido pela empresa e de um cartão de identificação, válido por um ano, renovado mediante exame de saúde."
      }
    ]
  },
  "NR-12": {
    "titulo": "Segurança no Trabalho em Máquinas e Equipamentos",
    "status": "ativa",
    "resumo": "A NR-12 é uma das normas mais técnicas e detalhadas: regula a segurança de máquinas e equipamentos, desde o projeto até o descarte, para evitar acidentes como amputações, esmagamentos e choques. Ela exige proteções físicas (fixas e móveis), dispositivos de parada de emergência, procedimentos seguros para manutenção e operação, capacitação dos trabalhadores e manuais de instrução em português — sempre seguindo a prioridade de proteção coletiva antes da individual.",
    "itens": [
      {
        "numero": "12.1",
        "titulo": "Arranjo físico e instalações",
        "explicacao": "As áreas de circulação precisam estar demarcadas e livres, as máquinas fixas devem estar bem niveladas e firmes, e máquinas com rodinhas precisam de travas para não se mexerem sozinhas."
      },
      {
        "numero": "12.2",
        "titulo": "Dispositivos de partida e parada",
        "explicacao": "Os botões de ligar e desligar não podem ficar dentro da zona de perigo, e a máquina nunca pode partir sozinha ao ser ligada na energia. É proibido usar chave geral como se fosse botão de liga/desliga."
      },
      {
        "numero": "12.3",
        "titulo": "Proteções fixas e móveis",
        "explicacao": "Proteções fixas só saem com ferramenta; as móveis, que abrem sem ferramenta, precisam ter um sistema que desligue a máquina automaticamente quando são abertas, para que o trabalhador não tenha acesso à parte perigosa em movimento."
      },
      {
        "numero": "12.4",
        "titulo": "Parada de emergência",
        "explicacao": "Toda máquina precisa de um ou mais botões de emergência, de fácil acesso, que parem a máquina no menor tempo possível e que só sejam rearmados manualmente, depois de resolvido o problema."
      },
      {
        "numero": "12.5",
        "titulo": "Manutenção e bloqueio de energia",
        "explicacao": "Antes de qualquer manutenção, todas as fontes de energia da máquina (elétrica, pneumática, hidráulica) precisam ser desligadas e bloqueadas com cadeado e etiqueta, informando quem fez o bloqueio e por quê."
      },
      {
        "numero": "12.6",
        "titulo": "Capacitação dos operadores",
        "explicacao": "Antes de operar qualquer máquina, o trabalhador precisa ser capacitado, sem custo para ele e dentro do horário de trabalho, com reciclagem sempre que houver mudança relevante na máquina ou no processo."
      },
      {
        "numero": "12.7",
        "titulo": "Sinalização e manual de instruções",
        "explicacao": "Toda máquina precisa de sinalização clara dos riscos (em português, não só a palavra 'perigo') e de um manual de instruções, também em português, disponível para quem trabalha com ela."
      }
    ]
  },
  "NR-13": {
    "titulo": "Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento",
    "status": "ativa",
    "resumo": "A NR-13 regula equipamentos que armazenam ou transportam fluidos sob pressão — caldeiras, vasos de pressão, tubulações de interligação e tanques metálicos — porque uma falha nesses equipamentos pode causar explosões graves. A norma exige documentação técnica detalhada, inspeções de segurança periódicas feitas por profissional habilitado, válvulas de segurança funcionando corretamente e operadores de caldeira com treinamento formal e prática supervisionada.",
    "itens": [
      {
        "numero": "13.1",
        "titulo": "Categorização dos equipamentos",
        "explicacao": "Vasos de pressão são classificados em categorias de I a V, combinando o tipo de fluido (mais ou menos perigoso) com o potencial de risco (pressão x volume). Caldeiras são divididas em categoria A (mais pressão) e categoria B (menos pressão)."
      },
      {
        "numero": "13.2",
        "titulo": "Prontuário e registro de segurança",
        "explicacao": "Cada equipamento precisa de um prontuário com dados do fabricante, materiais usados e histórico de testes, além de um registro de segurança onde se anotam as ocorrências e os resultados de cada inspeção."
      },
      {
        "numero": "13.3",
        "titulo": "Inspeções de segurança",
        "explicacao": "Existem inspeções iniciais (antes de o equipamento entrar em operação), periódicas (em prazos definidos por categoria, por exemplo, 12 meses para a maioria das caldeiras) e extraordinárias (depois de acidente, reparo importante ou longa parada)."
      },
      {
        "numero": "13.4",
        "titulo": "Válvulas de segurança",
        "explicacao": "São dispositivos que liberam a pressão automaticamente antes que ela ultrapasse o limite seguro do equipamento (a PMTA). Precisam ser testadas e inspecionadas periodicamente, e é proibido bloqueá-las sem justificativa técnica."
      },
      {
        "numero": "13.5",
        "titulo": "PMTA (Pressão Máxima de Trabalho Admissível)",
        "explicacao": "É o limite máximo de pressão que o equipamento pode suportar com segurança durante o funcionamento normal, calculado conforme o código de construção e registrado no prontuário e na placa de identificação do equipamento."
      },
      {
        "numero": "13.6",
        "titulo": "Operadores de caldeira",
        "explicacao": "Precisam ter ensino médio completo, treinamento formal de no mínimo 40 horas e um período de prática supervisionada (60 a 80 horas, dependendo da categoria da caldeira) antes de operar sozinhos."
      },
      {
        "numero": "13.7",
        "titulo": "Responsabilidades do empregador",
        "explicacao": "A empresa deve garantir que as inspeções sejam feitas por profissional habilitado, manter a documentação acessível aos trabalhadores e à CIPA, e comunicar à Inspeção do Trabalho e ao sindicato qualquer vazamento, incêndio ou explosão grave em até dois dias úteis."
      }
    ]
  },
  "NR-14": {
    "titulo": "Fornos",
    "status": "ativa",
    "resumo": "A NR-14 trata da operação segura de fornos industriais, ou seja, equipamentos que geram calor intenso para processos produtivos (fundição, cerâmica, siderurgia, padarias industriais, etc). Ela se aplica a qualquer empresa que use fornos em seus processos. O foco da norma é bem técnico: construção, instalação e proteção contra os riscos de calor excessivo, gases e explosão. É uma das NRs mais curtas e objetivas do conjunto.",
    "itens": [
      {
        "numero": "14.1",
        "titulo": "Objetivo",
        "explicacao": "Define que a norma existe para garantir que a operação de fornos seja feita com segurança, evitando acidentes relacionados a calor, gases e explosões."
      },
      {
        "numero": "14.2",
        "titulo": "Campo de aplicação",
        "explicacao": "Vale para qualquer organização que utilize fornos em seus processos produtivos, não importa o setor."
      },
      {
        "numero": "14.3.1",
        "titulo": "Construção dos fornos",
        "explicacao": "O forno precisa ser sólido e revestido com material refratário (resistente a altas temperaturas), de forma que o calor que irradia para fora não ultrapasse os limites de tolerância estabelecidos pela NR-15. Na prática: o técnico de segurança deve verificar se o revestimento está íntegro e se a temperatura externa ao forno está dentro do limite seguro."
      },
      {
        "numero": "14.3.2",
        "titulo": "Instalação do forno",
        "explicacao": "O local onde o forno é instalado deve seguir normas técnicas, oferecer segurança e conforto aos trabalhadores, e evitar que gases nocivos e calor se acumulem nas áreas vizinhas. Escadas e plataformas de acesso devem permitir que o trabalho seja feito com segurança."
      },
      {
        "numero": "14.3.3",
        "titulo": "Proteção contra explosão em fornos a gás ou líquido combustível",
        "explicacao": "Fornos que usam gás ou líquido combustível precisam de sistemas que impeçam explosões caso a chama apague sozinha ou haja falha ao acionar o queimador, e que evitem o retorno da chama para dentro da tubulação de gás."
      },
      {
        "numero": "14.3.4",
        "titulo": "Chaminé",
        "explicacao": "A chaminé deve ter dimensão adequada para que os gases da combustão saiam livremente, conforme normas técnicas oficiais. Chaminé subdimensionada é um risco de acúmulo de gases tóxicos no ambiente."
      }
    ]
  },
  "NR-15": {
    "titulo": "Atividades e Operações Insalubres",
    "status": "ativa",
    "resumo": "A NR-15 é uma das normas mais usadas no dia a dia da segurança do trabalho porque define o que é considerado insalubre — ou seja, atividade que expõe o trabalhador a agentes nocivos à saúde (ruído, calor, frio, radiação, agentes químicos, biológicos, vibração, umidade, entre outros) acima de limites considerados seguros. Ela se aplica a qualquer atividade onde haja exposição a esses agentes, e é a base técnica para o pagamento do adicional de insalubridade. É uma norma cheia de anexos técnicos, cada um tratando de um agente específico.",
    "itens": [
      {
        "numero": "15.1",
        "titulo": "Critérios de caracterização da insalubridade",
        "explicacao": "A insalubridade é caracterizada de três formas: (1) exposição acima dos limites de tolerância previstos nos anexos técnicos (ruído, calor, radiações, agentes químicos etc); (2) exercício de atividades já listadas como insalubres em anexos específicos, independentemente de medição; (3) comprovação por laudo de inspeção do local de trabalho, para os anexos que exigem avaliação qualitativa."
      },
      {
        "numero": "15.1.5",
        "titulo": "Conceito de limite de tolerância",
        "explicacao": "É a concentração ou intensidade máxima (ou mínima) de um agente, relacionada à sua natureza e ao tempo de exposição, que não causa dano à saúde do trabalhador durante toda a vida laboral. É o parâmetro técnico central da norma: abaixo dele, considera-se seguro; acima, insalubre."
      },
      {
        "numero": "Anexos (ruído, calor, radiação, químicos, biológicos)",
        "titulo": "Os principais agentes insalubres",
        "explicacao": "Cada anexo trata de um agente: Anexo 1 e 2 (ruído contínuo e de impacto), Anexo 3 (calor), Anexo 5 (radiações ionizantes), Anexo 7 (radiações não ionizantes), Anexo 11 e 13 (agentes químicos), Anexo 14 (agentes biológicos), além de anexos para vibração, frio, umidade e poeiras minerais. Na prática, o técnico de segurança usa esses anexos para saber qual medição fazer e qual limite aplicar em cada situação."
      },
      {
        "numero": "15.2 a 15.3",
        "titulo": "Adicional de insalubridade (percentuais)",
        "explicacao": "O adicional incide sobre o salário mínimo da região e varia conforme o grau de risco: 40% para grau máximo, 20% para grau médio e 10% para grau mínimo. Se houver mais de um agente insalubre ao mesmo tempo, considera-se apenas o de grau mais elevado — não se somam os adicionais."
      },
      {
        "numero": "15.4",
        "titulo": "Eliminação ou neutralização da insalubridade",
        "explicacao": "Quando a empresa consegue eliminar o agente nocivo (por engenharia, por exemplo trocando um processo) ou neutralizá-lo (por EPI adequado e comprovadamente eficaz), o pagamento do adicional deixa de ser devido. Essa neutralização precisa ser comprovada por avaliação pericial de órgão competente — não basta a empresa dizer que forneceu EPI."
      },
      {
        "numero": "15.5 a 15.7",
        "titulo": "Perícia e fiscalização",
        "explicacao": "Empresas e sindicatos podem solicitar perícia técnica à Superintendência Regional do Trabalho para confirmar ou descartar a insalubridade de uma atividade. Essa perícia administrativa não impede que a Justiça do Trabalho determine sua própria perícia em caso de disputa judicial."
      }
    ]
  },
  "NR-16": {
    "titulo": "Atividades e Operações Perigosas",
    "status": "ativa",
    "resumo": "A NR-16 define o que é considerado trabalho perigoso — atividades com risco acentuado à integridade física do trabalhador, como contato com explosivos, inflamáveis, eletricidade de alta tensão, radiação ionizante, segurança patrimonial/pessoal (risco de roubo e violência) e, mais recentemente, uso de motocicleta no trabalho. Diferente da insalubridade (que é sobre exposição contínua a agentes nocivos), a periculosidade é sobre risco de acidente grave e imediato. Aplica-se a qualquer empresa cujos trabalhadores exerçam essas atividades específicas listadas nos anexos.",
    "itens": [
      {
        "numero": "16.1",
        "titulo": "Conceito e adicional de periculosidade",
        "explicacao": "As atividades perigosas são as listadas nos anexos da norma (explosivos, inflamáveis, eletricidade, radiação, segurança pessoal/patrimonial e motocicleta). Quem exerce essas atividades tem direito a um adicional de 30% sobre o salário-base, sem considerar gratificações, prêmios ou participação nos lucros."
      },
      {
        "numero": "16.2",
        "titulo": "Laudo técnico e responsabilidade do empregador",
        "explicacao": "Cabe ao empregador caracterizar ou descaracterizar a periculosidade por meio de laudo técnico elaborado por Médico do Trabalho ou Engenheiro de Segurança do Trabalho, conforme exige a CLT. Isso não impede a fiscalização do Ministério do Trabalho nem a perícia judicial em caso de reclamação trabalhista."
      },
      {
        "numero": "Anexo 1 - Explosivos",
        "titulo": "Trabalho com explosivos",
        "explicacao": "São perigosas as atividades de armazenamento, transporte, manuseio, carregamento e detonação de explosivos sujeitos à ação de calor, umidade, faíscas ou choques. As áreas de risco ao redor de depósitos de explosivos devem ser delimitadas fisicamente pelo empregador, com distância mínima calculada conforme a quantidade armazenada."
      },
      {
        "numero": "Anexo 2 - Inflamáveis",
        "titulo": "Trabalho com inflamáveis",
        "explicacao": "Inclui produção, transporte, armazenamento, carregamento e descarga de líquidos e gases inflamáveis (postos de combustível, caminhões-tanque, botijões de gás etc). Há exceções: o transporte de pequenas quantidades (até 200 litros de líquido ou 135 kg de gás liquefeito) não gera direito ao adicional."
      },
      {
        "numero": "Anexo 3 - Segurança pessoal e patrimonial",
        "titulo": "Vigilantes e seguranças",
        "explicacao": "Reconhece como perigosa a exposição a roubos e outras formas de violência física no trabalho, abrangendo vigilantes de empresas de segurança privada e seguranças de instalações públicas (metrô, portos, aeroportos) contratados pela administração pública."
      },
      {
        "numero": "Anexo 4 - Energia elétrica",
        "titulo": "Trabalho com eletricidade",
        "explicacao": "Trabalhadores que atuam em instalações elétricas energizadas de alta tensão, ou próximos a elas, têm direito ao adicional. Não é devido quando a instalação está desenergizada e devidamente liberada para trabalho seguro, conforme a NR-10."
      },
      {
        "numero": "Anexo 5 - Motocicletas",
        "titulo": "Uso de motocicleta no trabalho",
        "explicacao": "É um anexo mais recente: considera perigoso o uso de motocicleta para deslocamento do trabalhador em vias públicas durante a jornada (como entregadores e motoboys). Não é perigoso o simples deslocamento de casa para o trabalho, nem o uso só dentro de áreas privadas da empresa."
      },
      {
        "numero": "Anexo - Radiações ionizantes",
        "titulo": "Trabalho com radiação",
        "explicacao": "Cobre produção, manuseio e transporte de materiais radioativos, operação de reatores nucleares, aparelhos de raios-X e medicina nuclear. Equipamentos móveis de raios-X usados em diagnóstico médico comum, porém, não são considerados perigosos."
      }
    ]
  },
  "NR-17": {
    "titulo": "Ergonomia",
    "status": "ativa",
    "resumo": "A NR-17 é uma das normas mais aplicadas no dia a dia, pois trata da adaptação das condições de trabalho às características do trabalhador, visando conforto, segurança e desempenho eficiente. Ela cobre levantamento de peso, mobiliário, máquinas e ferramentas, condições ambientais (iluminação, ruído, temperatura) e organização do trabalho (ritmo, pausas, metas). Aplica-se a toda empresa com empregados CLT, e tem um anexo específico e bastante detalhado para teleatendimento/telemarketing.",
    "itens": [
      {
        "numero": "17.1",
        "titulo": "Objetivo",
        "explicacao": "A norma busca adaptar as condições de trabalho às características psicofisiológicas dos trabalhadores, proporcionando conforto, segurança, saúde e desempenho eficiente no trabalho."
      },
      {
        "numero": "17.3",
        "titulo": "Análise Ergonômica do Trabalho (AET)",
        "explicacao": "É o documento técnico central da ergonomia: obrigatório quando há necessidade de análise aprofundada de riscos ergonômicos, quando as ações já adotadas não resolveram o problema, ou após acidentes/doenças relacionados às condições de trabalho. A AET deve seguir etapas (análise da demanda, da organização, da atividade, diagnóstico e recomendações), ouvir os trabalhadores, e seu relatório deve ser mantido arquivado por 20 anos. Microempresas de baixo risco são dispensadas na maioria dos casos."
      },
      {
        "numero": "17.4",
        "titulo": "Organização do trabalho",
        "explicacao": "A empresa deve considerar o ritmo, o conteúdo das tarefas e a exigência cognitiva ao organizar o trabalho, evitando posturas extremas, movimentos repetitivos e força excessiva. Quando há sobrecarga, é preciso adotar pelo menos duas medidas entre pausas, alternância de tarefas e mudanças na execução — as pausas não podem ser usadas para aumentar o ritmo individual."
      },
      {
        "numero": "17.5",
        "titulo": "Levantamento e transporte manual de cargas",
        "explicacao": "É proibido exigir ou aceitar transporte manual de carga que comprometa a saúde ou segurança do trabalhador. Para levantamento não eventual, o empregador deve usar meios técnicos, ajustar peso e frequência, reduzir distâncias e prever pausas a cada no máximo duas horas, além de treinar os trabalhadores designados sobre métodos corretos de levantamento."
      },
      {
        "numero": "17.6",
        "titulo": "Mobiliário dos postos de trabalho",
        "explicacao": "Mesas, cadeiras e bancadas devem ter regulagens compatíveis com o conjunto de trabalhadores e com a tarefa. Assentos precisam ter altura ajustável, borda frontal arredondada e encosto que proteja a lombar. Em trabalho em pé, a empresa deve disponibilizar assentos para pausas."
      },
      {
        "numero": "17.7",
        "titulo": "Máquinas, equipamentos e ferramentas",
        "explicacao": "Monitores, painéis e comandos devem ser de fácil visualização e acesso, reduzindo erros. Notebooks de uso não eventual precisam ter adaptação de teclado, mouse ou tela externa. Ferramentas manuais devem ter empunhadura adequada e não causar compressão excessiva na mão."
      },
      {
        "numero": "17.8",
        "titulo": "Condições ambientais de conforto",
        "explicacao": "Trata de iluminação adequada sem ofuscamento, ruído de fundo (até 65 dB(A) em atividades que exigem atenção intelectual constante) e temperatura entre 18°C e 25°C em ambientes climatizados, evitando correntes de ar diretas sobre os trabalhadores."
      },
      {
        "numero": "Anexo II",
        "titulo": "Teleatendimento e telemarketing",
        "explicacao": "Anexo detalhado para call centers: limita a jornada efetiva a 6 horas diárias e 36 semanais, exige duas pausas de 10 minutos fora do posto mais um intervalo de 20 minutos para repouso e alimentação, proíbe scripts rígidos e cobrança por metas abusivas, e exige treinamento inicial de 4 horas e reciclagem semestral."
      }
    ]
  },
  "NR-18": {
    "titulo": "Segurança e Saúde no Trabalho na Indústria da Construção",
    "status": "ativa",
    "resumo": "A NR-18 é a norma mais extensa e detalhada da construção civil, aplicando-se a todas as atividades da construção, demolição, reforma e manutenção de edificações. Ela organiza a segurança do canteiro de obras desde o planejamento (PGR, áreas de vivência) até os aspectos operacionais específicos: escavações, andaimes, elevadores, proteção contra quedas, máquinas e instalações elétricas temporárias. É uma norma de gestão e também muito técnica/operacional.",
    "itens": [
      {
        "numero": "18.3",
        "titulo": "Responsabilidades da organização da obra",
        "explicacao": "Antes de iniciar qualquer obra, a empresa deve fazer a Comunicação Prévia de Obras ao Ministério do Trabalho, e impedir que trabalhadores entrem ou permaneçam no canteiro sem as proteções exigidas pela norma."
      },
      {
        "numero": "18.4",
        "titulo": "Programa de Gerenciamento de Riscos (PGR) da obra",
        "explicacao": "É obrigatório em todo canteiro, elaborado por profissional habilitado em segurança do trabalho (em obras pequenas, até 7m de altura e 10 trabalhadores, pode ser profissional apenas qualificado). Além dos requisitos gerais da NR-1, o PGR da construção deve incluir o projeto da área de vivência, o projeto elétrico das instalações temporárias e os projetos dos sistemas de proteção coletiva."
      },
      {
        "numero": "18.5",
        "titulo": "Áreas de vivência",
        "explicacao": "São as instalações de apoio ao trabalhador: sanitários, vestiários, local de refeição e, quando houver trabalhadores alojados, alojamento. Devem oferecer segurança, conforto e privacidade. A norma define proporções mínimas, como 1 conjunto sanitário para cada 20 trabalhadores e distância máxima de 150m entre o posto de trabalho e o sanitário mais próximo."
      },
      {
        "numero": "18.6",
        "titulo": "Instalações elétricas temporárias",
        "explicacao": "Devem seguir a NR-10, com projeto de profissional habilitado, proteção contra impactos e umidade, aterramento de proteção e uso obrigatório de dispositivo DR (disjuntor diferencial residual) nas situações exigidas pela norma."
      },
      {
        "numero": "18.7",
        "titulo": "Escavações, fundações e desmonte de rochas",
        "explicacao": "Escavações acima de 1,25m de profundidade só podem começar com liberação de profissional habilitado, exigem escoramento conforme projeto e inspeção diária. Desmonte com explosivos exige plano de fogo e um blaster (profissional especializado) responsável por cada detonação."
      },
      {
        "numero": "18.9",
        "titulo": "Proteção contra quedas de altura",
        "explicacao": "Exige proteção coletiva (guarda-corpos, redes, plataformas) em qualquer local com risco de queda, projetada por profissional habilitado. A periferia da obra deve ser protegida desde o início da concretagem do primeiro pavimento — é uma das obrigações mais fiscalizadas na construção civil."
      },
      {
        "numero": "18.10",
        "titulo": "Máquinas, equipamentos e equipamentos de guindar (gruas)",
        "explicacao": "Guindastes e gruas precisam de plano de carga elaborado por profissional habilitado, limitadores de carga e altura, e inspeções diárias registradas. A operação é proibida com ventos acima de 72 km/h, e é proibido o transporte de pessoas nesses equipamentos."
      },
      {
        "numero": "18.11",
        "titulo": "Elevadores de obra",
        "explicacao": "Empresas que instalam, montam e fazem manutenção de elevadores de obra devem ser registradas no conselho de classe. Documentos obrigatórios no canteiro incluem programa de manutenção, laudo de freios de emergência a cada 90 dias e registro diário de vistorias."
      },
      {
        "numero": "18.12",
        "titulo": "Andaimes e plataformas de trabalho",
        "explicacao": "Devem ter projeto de profissional habilitado, proteção contra quedas em todo o perímetro (exceto na face de trabalho) e liberação formal de uso antes de cada utilização. É proibido remover dispositivos de segurança ou usar escadas apoiadas sobre o piso do andaime."
      },
      {
        "numero": "18 (responsabilidades gerais)",
        "titulo": "Responsabilidades do empregador e do trabalhador",
        "explicacao": "O empregador deve elaborar e manter o PGR, prover áreas de vivência, água potável e ferramentas manuais gratuitamente, e garantir que projetos e laudos sejam feitos por profissionais habilitados. O trabalhador deve zelar pelas ferramentas que utiliza e devolvê-las quando solicitado, além de seguir os treinamentos e procedimentos de segurança."
      }
    ]
  },
  "NR-19": {
    "titulo": "Explosivos",
    "status": "ativa",
    "resumo": "A NR-19 regula a segurança em todas as etapas que envolvem explosivos: fabricação, manuseio, armazenamento e transporte. Aplica-se a indústrias de pólvora, mineração que usa explosivos para desmonte de rocha, e empresas de transporte desses materiais. É uma norma de altíssimo risco, com exigências rígidas de infraestrutura (paióis, distâncias de segurança), documentação (PGR específico, plano de emergência) e restrições de pessoal (proibição de trabalho de menores de 18 anos).",
    "itens": [
      {
        "numero": "19.3",
        "titulo": "Disposições gerais e restrição de localização",
        "explicacao": "A fabricação de explosivos é proibida no perímetro urbano de cidades, vilas e povoados. As atividades devem seguir, além da NR-19, o normativo de explosivos do Exército Brasileiro, que é o órgão que fiscaliza e certifica o setor no Brasil."
      },
      {
        "numero": "19.4 (Anexo II)",
        "titulo": "Classificação dos explosivos",
        "explicacao": "Os explosivos se dividem em categorias técnicas: explosivos de ruptura (detonam por onda de choque), baixos explosivos como pólvoras (deflagram quando confinados), explosivos iniciadores (muito sensíveis, usados para detonar outros) e insumos químicos. Essa classificação determina as distâncias de segurança e as regras de armazenamento conjunto."
      },
      {
        "numero": "19.5",
        "titulo": "Fabricação",
        "explicacao": "Somente organizações com Certificado de Conformidade homologado pelo Exército podem fabricar explosivos. As áreas de risco precisam de monitoramento eletrônico permanente, e atividades como o encartuchamento devem ocorrer em locais isolados com no máximo quatro trabalhadores por vez, para limitar o número de pessoas expostas em caso de acidente."
      },
      {
        "numero": "19.6",
        "titulo": "Armazenamento em paióis",
        "explicacao": "Os explosivos devem ficar em depósitos permanentes (paióis) construídos especificamente para isso, com paredes duplas de alvenaria ou concreto. As distâncias mínimas em relação a edifícios, rodovias e outros depósitos seguem tabelas técnicas conforme a quantidade armazenada — distâncias que podem ser reduzidas pela metade se o depósito for barricado (protegido por terraplenagem)."
      },
      {
        "numero": "19.7",
        "titulo": "Transporte",
        "explicacao": "O transporte segue as normas da ANTT (rodoviário), ANTAQ (aquaviário) ou ANAC (aéreo), com veículo de carroceria fechada, sinalização visível e acessórios iniciadores transportados separadamente em compartimento blindado. Veículos devem ter rastreamento GPS em tempo real e botão de pânico."
      },
      {
        "numero": "19.9 (responsabilidades)",
        "titulo": "PGR, Responsável Técnico e Plano de Emergência",
        "explicacao": "O PGR deve ser elaborado com equipe multidisciplinar e revisado no mínimo anualmente. A empresa precisa ter um Responsável Técnico legalmente habilitado e um Plano de Emergência e Combate a Incêndio e Explosão, simulado e revisado todo ano, com cópia enviada à Defesa Civil e ao Corpo de Bombeiros."
      },
      {
        "numero": "19.11",
        "titulo": "Restrições de pessoal",
        "explicacao": "É proibida a mão de obra de menores de 18 anos na fabricação e no manuseio de matérias-primas explosivas. Também é proibida a remuneração por produtividade na fabricação de fogos de artifício, para não incentivar pressa em uma atividade de altíssimo risco."
      }
    ]
  },
  "NR-20": {
    "titulo": "Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis",
    "status": "ativa",
    "resumo": "A NR-20 regula a segurança em instalações que lidam com líquidos inflamáveis e combustíveis e gases inflamáveis — de postos de combustível a refinarias de petróleo. A norma classifica as instalações por grau de risco (Classe I, II e III) conforme o tipo de atividade e a quantidade armazenada, e exige gestão de riscos, documentação técnica (prontuário da instalação) e capacitação específica dos trabalhadores. Não se aplica a plataformas de petróleo (regidas pela NR-37) nem a residências unifamiliares.",
    "itens": [
      {
        "numero": "20.3",
        "titulo": "Definições essenciais",
        "explicacao": "Líquido inflamável é aquele com ponto de fulgor até 60°C; líquido combustível tem ponto de fulgor acima de 60°C e até 93°C; gás inflamável é o que inflama em contato com o ar em condições normais de temperatura e pressão. Essas definições técnicas determinam qual parte da norma se aplica a cada substância."
      },
      {
        "numero": "20.4",
        "titulo": "Classificação das instalações por grau de risco",
        "explicacao": "As instalações se dividem em Classe I (menor risco, como postos de combustível), Classe II (distribuição e transporte em maior escala) e Classe III (refinarias, petroquímicas, usinas de etanol). A classificação determina a profundidade exigida na análise de risco e no treinamento dos trabalhadores."
      },
      {
        "numero": "20.6",
        "titulo": "Prontuário da instalação",
        "explicacao": "É o documento central da norma: reúne o projeto, o plano de inspeção e manutenção, a análise de riscos, o plano de prevenção de vazamentos e incêndios, e o plano de resposta a emergências. Deve ter índice organizado e ficar disponível às autoridades e aos trabalhadores."
      },
      {
        "numero": "20.7",
        "titulo": "Análise de riscos",
        "explicacao": "Instalações Classe I usam Análise Preliminar de Perigos/Riscos (APP/APR); Classes II e III usam metodologia escolhida por profissional habilitado, com justificativa registrada. A análise deve ser revisada periodicamente, após mudanças significativas ou após acidentes e incidentes."
      },
      {
        "numero": "20.9",
        "titulo": "Procedimentos operacionais",
        "explicacao": "Devem cobrir pré-operação, operação normal, situações de emergência e parada (normal e de emergência). A revisão é obrigatória a cada 3 anos (Classes I e II) ou 5 anos (Classe III), ou antes disso se houver mudanças relevantes."
      },
      {
        "numero": "20.12",
        "titulo": "Capacitação dos trabalhadores",
        "explicacao": "Existem seis níveis de curso (Iniciação, Básico, Intermediário, Avançado I, Avançado II e Específico), com carga horária que varia conforme a classe da instalação. Os cursos são custeados pelo empregador, realizados durante o expediente, e precisam de atualização periódica (de anual a trienal, dependendo do nível)."
      },
      {
        "numero": "20.15",
        "titulo": "Equipe de resposta a emergências",
        "explicacao": "Exige exames médicos específicos (incluindo fatores psicossociais), participação em geral voluntária (salvo quando a função exigir) e exercícios simulados obrigatórios ao menos uma vez por ano, com resultados divulgados aos trabalhadores."
      },
      {
        "numero": "20.16",
        "titulo": "Comunicação de acidentes graves",
        "explicacao": "Morte de trabalhador, explosão ou queimaduras graves com internação, ou acionamento de plano de emergência de grande magnitude devem ser comunicados à Inspeção do Trabalho e ao sindicato até o segundo dia útil, com relatório de investigação das causas."
      }
    ]
  },
  "NR-21": {
    "titulo": "Trabalho a Céu Aberto",
    "status": "ativa",
    "resumo": "A NR-21 trata da proteção de trabalhadores que atuam a céu aberto, expostos diretamente às intempéries (sol, chuva, calor, frio, ventos), com foco importante também nas condições de moradia fornecida pelo empregador a trabalhadores rurais que residem no local de trabalho. É uma norma relativamente curta e com forte aplicação no agronegócio e em atividades de campo. Observação: o texto vigente não traz uma seção dedicada a 'local de descanso' isolado nem a 'fornecimento de EPI' como item próprio — quem precisa de EPI segue a NR-6 de forma geral.",
    "itens": [
      {
        "numero": "21.1 a 21.2",
        "titulo": "Proteção contra intempéries",
        "explicacao": "A norma exige que haja abrigos, ainda que simples, para proteger o trabalhador contra sol excessivo, calor, frio, umidade e ventos inconvenientes durante o trabalho a céu aberto."
      },
      {
        "numero": "21.3 e 21.6 a 21.7",
        "titulo": "Moradia fornecida pelo empregador",
        "explicacao": "Quando o trabalhador reside no próprio local de trabalho (comum em fazendas e canteiros rurais), a moradia fornecida — tanto para o trabalhador quanto para sua família — deve ter condições sanitárias adequadas. É expressamente proibida a moradia coletiva de famílias em um mesmo espaço."
      },
      {
        "numero": "21.8 a 21.11",
        "titulo": "Localização e construção da moradia",
        "explicacao": "As casas devem ficar em local arejado, livre de vegetação descontrolada e a pelo menos 50 metros de depósitos de esterco, currais ou pocilgas. A cobertura precisa ser impermeável e não combustível, e o poço de água deve ser protegido contra contaminação."
      },
      {
        "numero": "21.12 a 21.14",
        "titulo": "Estrutura mínima e saneamento",
        "explicacao": "Toda moradia deve ter, no mínimo, um dormitório, uma cozinha e um compartimento sanitário. As fossas negras precisam ficar a pelo menos 15 metros do poço de água e 10 metros da casa, protegendo contra contaminação da água potável."
      },
      {
        "numero": "21.4 a 21.5",
        "titulo": "Saúde pública em áreas de risco de endemias",
        "explicacao": "Em regiões pantanosas ou alagadiças, a empresa deve adotar medidas de profilaxia de endemias (como malária e esquistossomose) conforme as normas de saúde pública, mantendo condições sanitárias compatíveis com a atividade exercida."
      }
    ]
  },
  "NR-22": {
    "titulo": "Segurança e Saúde Ocupacional na Mineração",
    "status": "ativa",
    "resumo": "A NR-22 é a norma que regula a segurança e saúde em atividades de mineração, subterrânea ou a céu aberto, incluindo garimpos e o beneficiamento de minério. É uma norma extensa e muito técnica, cobrindo desde o gerenciamento de riscos (GRO/PGR) até aspectos operacionais como transporte de pessoal, ventilação em subsolo, estabilidade de maciços rochosos e uso de explosivos na mina.",
    "itens": [
      {
        "numero": "22.3",
        "titulo": "Responsabilidades da organização",
        "explicacao": "A empresa deve manter toda mina sob supervisão técnica de profissional legalmente habilitado, designar responsáveis técnicos por setor e, crucialmente, interromper qualquer atividade que exponha trabalhadores a risco grave e iminente."
      },
      {
        "numero": "22.4",
        "titulo": "Gerenciamento de Riscos (GRO) e PGR específico da mineração",
        "explicacao": "Além do GRO/PGR geral da NR-1, a mineração exige atenção a riscos específicos: atmosferas explosivas, deficiência de oxigênio, ventilação mecânica, proteção respiratória e auditiva, e estabilidade dos maciços rochosos. Quando há contratação de terceiros, a contratante deve coordenar as medidas de segurança quando as atividades forem simultâneas."
      },
      {
        "numero": "22.5",
        "titulo": "Direitos e deveres dos trabalhadores",
        "explicacao": "O trabalhador tem o direito de interromper suas tarefas diante de risco grave e iminente, comunicando imediatamente o superior, e o dever de avisar sobre situações de risco que perceber no ambiente de trabalho."
      },
      {
        "numero": "22.6",
        "titulo": "Organização dos locais e atividades de maior risco",
        "explicacao": "Para atividades de maior risco no subsolo (como abatimento de choco, uso de explosivos) ou a céu aberto (uso de explosivos), é obrigatório designar equipes de no mínimo dois trabalhadores, nunca trabalho solitário nessas frentes."
      },
      {
        "numero": "22.7",
        "titulo": "Circulação e transporte de pessoas e materiais",
        "explicacao": "Exige um plano de trânsito com regras de preferência e velocidades permitidas. O transporte de pessoas é obrigatório quando o deslocamento a pé ultrapassar 1.000 metros, e vagonetas não podem ser usadas para transporte de material."
      },
      {
        "numero": "22.13",
        "titulo": "Estabilidade dos maciços rochosos",
        "explicacao": "A empresa precisa monitorar tecnicamente estratos, teto, paredes, bancadas e taludes. Em situações de potencial instabilidade, a atividade deve ser paralisada imediatamente e os trabalhadores afastados, só retomando após medidas corretivas e liberação formal da supervisão técnica."
      },
      {
        "numero": "22.19",
        "titulo": "Uso de explosivos na mineração",
        "explicacao": "Exige plano de fogo elaborado por profissional habilitado e execução supervisionada por um blaster. O retorno à frente detonada só é permitido após a dissipação dos gases, confirmação da estabilidade do terreno e eliminação de fogos falhados (explosivos que não detonaram)."
      },
      {
        "numero": "22.22",
        "titulo": "Ventilação em áreas subterrâneas",
        "explicacao": "Exige sistema de ventilação mecânica projetado por profissional habilitado, com Plano de Ventilação (PV). O oxigênio mínimo nas áreas de circulação de pessoas deve ser de 19%, com monitoramento mensal de velocidade do ar, vazão, umidade e temperatura."
      }
    ]
  },
  "NR-23": {
    "titulo": "Proteção Contra Incêndios",
    "status": "ativa",
    "resumo": "A NR-23 estabelece medidas básicas para prevenir incêndios nos locais de trabalho, com foco principal em saídas de emergência e informação dos trabalhadores. É uma norma relativamente enxuta no âmbito federal, porque delega grande parte das exigências técnicas detalhadas (como tipos de extintores, dimensionamento de brigada, projeto de combate a incêndio) à legislação estadual de corpos de bombeiros e a normas técnicas complementares — por isso, na prática, o técnico de segurança do trabalho deve sempre consultar também a legislação do Corpo de Bombeiros do estado onde a empresa está localizada.",
    "itens": [
      {
        "numero": "23.1",
        "titulo": "Objetivo",
        "explicacao": "Estabelecer medidas de prevenção para evitar incêndios nos ambientes de trabalho e garantir que, caso ocorram, os trabalhadores possam sair em segurança."
      },
      {
        "numero": "23.3",
        "titulo": "Medidas de prevenção e remissão à legislação estadual",
        "explicacao": "A norma determina que toda organização siga a legislação estadual de prevenção e combate a incêndio e, de forma complementar, as normas técnicas oficiais aplicáveis — ou seja, a NR-23 não substitui as exigências do Corpo de Bombeiros local, apenas as complementa."
      },
      {
        "numero": "23.3.3 a 23.3.5",
        "titulo": "Saídas de emergência",
        "explicacao": "Os locais de trabalho devem ter saídas em número suficiente e bem posicionadas para que as pessoas consigam sair com rapidez e segurança em caso de emergência. Nenhuma saída de emergência pode ser trancada a chave durante a jornada de trabalho — pode até ter dispositivo de travamento, desde que abra com facilidade por dentro."
      },
      {
        "numero": "23.3.4",
        "titulo": "Sinalização",
        "explicacao": "Aberturas, saídas e vias de circulação de emergência devem ser identificadas e sinalizadas, indicando claramente a direção da saída, seguindo a legislação estadual e normas técnicas complementares."
      },
      {
        "numero": "23.3.2",
        "titulo": "Treinamento e informação dos trabalhadores",
        "explicacao": "Os trabalhadores precisam ser treinados e informados sobre o uso dos equipamentos de combate a incêndio existentes na empresa, os procedimentos de evacuação segura e o funcionamento dos dispositivos de alarme. (Detalhes técnicos sobre tipos de extintores e formação de brigada tipicamente vêm da legislação estadual do Corpo de Bombeiros, e não do texto federal da NR-23.)"
      }
    ]
  },
  "NR-24": {
    "titulo": "Condições Sanitárias e de Conforto nos Locais de Trabalho",
    "status": "ativa",
    "resumo": "A NR-24 estabelece as condições mínimas de higiene e conforto que todo local de trabalho precisa oferecer: instalações sanitárias, vestiários, locais de refeição, fornecimento de água potável e, quando aplicável, condições de alojamento. É uma norma muito prática e usada em praticamente toda inspeção de segurança do trabalho, pois define números exatos (proporção de vasos sanitários por trabalhador, dimensões mínimas de armários etc).",
    "itens": [
      {
        "numero": "24.2",
        "titulo": "Instalações sanitárias",
        "explicacao": "Todo estabelecimento deve ter vaso sanitário sifonado com assento e tampa, e lavatório. A regra geral é no mínimo 1 instalação sanitária para cada 20 trabalhadores ou fração, separadas por sexo. Em atividades com materiais infectantes ou substâncias tóxicas, a proporção de lavatórios é maior: 1 para cada 10 trabalhadores."
      },
      {
        "numero": "24.3",
        "titulo": "Requisitos técnicos dos sanitários",
        "explicacao": "Cada vaso sanitário fica em compartimento individual, com porta que impeça a visão interna e papel higiênico disponível. Chuveiros são obrigatórios em proporções que variam conforme o tipo de atividade (1 para cada 10, em atividades com contaminantes, ou 1 para cada 20, em atividades com poeira e esforço físico), sempre em boxes individuais com água quente e fria."
      },
      {
        "numero": "24.4",
        "titulo": "Vestiários",
        "explicacao": "São obrigatórios quando a atividade exige troca de roupa no local ou quando há chuveiro disponível. Cada trabalhador precisa de armário individual com trancamento; em atividades contaminantes, exige-se armário duplo (para separar roupa de trabalho da roupa civil) ou dois armários simples."
      },
      {
        "numero": "24.5",
        "titulo": "Locais para refeições",
        "explicacao": "O empregador deve oferecer local confortável e higiênico para as refeições nos intervalos. Para mais de 30 trabalhadores, o local precisa ficar fora da área de trabalho, com pisos laváveis, ventilação, lavatórios próximos e meios de aquecer e conservar alimentos."
      },
      {
        "numero": "24.9",
        "titulo": "Fornecimento de água potável",
        "explicacao": "Todo local de trabalho deve fornecer água potável, sendo proibido o uso de copos coletivos. A regra é 1 bebedouro para cada 50 trabalhadores ou fração; sem água corrente disponível, a água deve ser fornecida em recipientes lacrados."
      },
      {
        "numero": "24.7",
        "titulo": "Condições de alojamento",
        "explicacao": "Quando a empresa fornece alojamento, este deve reunir dormitórios, sanitários, refeitório e área de lavagem de roupas. Dormitórios são separados por sexo, com capacidade máxima de 8 trabalhadores por quarto e área mínima calculada por cama. Colchões precisam ser certificados pelo INMETRO, e é proibido cozinhar dentro dos quartos."
      }
    ]
  },
  "NR-25": {
    "titulo": "Resíduos Industriais",
    "status": "ativa",
    "resumo": "A NR-25 é a norma mais curta e conceitual do grupo, tratando do gerenciamento de resíduos gerados pelos processos industriais (sólidos, líquidos ou gasosos) do ponto de vista da segurança e saúde do trabalhador — e não do ponto de vista ambiental propriamente dito (que é regulado por outras legislações). Aplica-se a qualquer indústria que gere resíduos diferentes do lixo doméstico comum, como cinzas, lodos, óleos, escórias e substâncias ácidas ou alcalinas.",
    "itens": [
      {
        "numero": "25.1",
        "titulo": "Objetivo e definição de resíduo industrial",
        "explicacao": "A norma define resíduo industrial como qualquer material sólido, líquido ou gasoso que, por suas características físicas, químicas ou microbiológicas, difere do resíduo doméstico comum — por exemplo, cinzas, lodos, óleos, escórias, poeiras e borras de processos industriais."
      },
      {
        "numero": "25.2",
        "titulo": "Redução da exposição ocupacional",
        "explicacao": "A empresa deve buscar a menor exposição possível dos trabalhadores aos resíduos, utilizando as melhores práticas tecnológicas e organizacionais disponíveis em cada etapa do processo."
      },
      {
        "numero": "25.3",
        "titulo": "Gestão do ciclo completo dos resíduos",
        "explicacao": "Os resíduos sólidos e efluentes líquidos devem ser coletados, acondicionados, armazenados, transportados, tratados e encaminhados à disposição final de forma controlada, com medidas de prevenção em cada uma dessas etapas — não basta tratar só o descarte final."
      },
      {
        "numero": "25.4",
        "titulo": "Casos especiais: rejeitos radioativos e risco biológico",
        "explicacao": "Rejeitos radioativos devem ser dispostos conforme as normas da Autoridade Nacional de Segurança Nuclear (ANSN), e resíduos com risco biológico seguem a legislação sanitária e ambiental aplicável — ou seja, a NR-25 remete a normas específicas para esses casos mais críticos."
      },
      {
        "numero": "25.5",
        "titulo": "Responsabilidade de capacitação",
        "explicacao": "A empresa deve capacitar continuamente os trabalhadores envolvidos em qualquer etapa do gerenciamento de resíduos (coleta, transporte, tratamento) sobre os riscos ocupacionais envolvidos e as medidas de prevenção aplicáveis."
      }
    ]
  },
  "NR-26": {
    "titulo": "Sinalização de Segurança",
    "status": "ativa",
    "resumo": "Essa norma trata de como usar cores, sinais e rótulos para avisar sobre perigos no ambiente de trabalho. Ela se aplica a qualquer estabelecimento ou local de trabalho e serve tanto para sinalizar riscos físicos (como tubulações, áreas de circulação e equipamentos de segurança) quanto para classificar e rotular produtos químicos perigosos. O objetivo é que qualquer pessoa, só de olhar a cor ou o rótulo, entenda rapidamente que há um risco e qual é esse risco, complementando (e nunca substituindo) outras medidas de prevenção de acidentes.",
    "itens": [
      {
        "numero": "26.1",
        "titulo": "Objetivo",
        "explicacao": "Define que a norma existe para estabelecer sinalização de segurança nos locais de trabalho, ajudando a prevenir acidentes e doenças ocupacionais por meio de avisos visuais padronizados."
      },
      {
        "numero": "26.2",
        "titulo": "Campo de aplicação",
        "explicacao": "A norma vale para qualquer estabelecimento ou local de trabalho, independentemente do ramo de atividade. Isso significa que toda empresa, de qualquer tamanho ou setor, precisa adotar sinalização adequada."
      },
      {
        "numero": "26.3",
        "titulo": "Sinalização por cor",
        "explicacao": "As cores devem seguir um padrão técnico (normas ABNT) para indicar perigos, delimitar áreas, identificar equipamentos de segurança e tubulações de líquidos e gases. É importante usar as cores com moderação: cor demais no ambiente cansa a vista e acaba perdendo o efeito de alerta, além de a cor nunca dispensar outras ações de prevenção."
      },
      {
        "numero": "26.4.1",
        "titulo": "Classificação de produtos químicos (GHS)",
        "explicacao": "Todo produto químico usado na empresa deve ser classificado quanto ao perigo seguindo o Sistema Globalmente Harmonizado (GHS), um padrão internacional adotado pela ONU. Essa classificação é a base para saber que tipo de rótulo e de ficha de segurança o produto precisa ter."
      },
      {
        "numero": "26.4.2",
        "titulo": "Rotulagem preventiva",
        "explicacao": "Produtos químicos perigosos precisam de rótulo completo, com pictogramas de perigo, palavra de advertência, frases de perigo e de precaução. Produtos não perigosos podem ter rótulo simplificado, e saneantes já registrados na Anvisa têm dispensa de parte dessas exigências."
      },
      {
        "numero": "26.4.3",
        "titulo": "Ficha de dados de segurança (FISPQ)",
        "explicacao": "O fabricante, importador ou fornecedor deve elaborar e disponibilizar a Ficha de Informações de Segurança de Produtos Químicos para todo produto perigoso, seguindo o formato do GHS. Essa ficha também é exigida para produtos não classificados como perigosos quando o uso típico pode gerar risco."
      },
      {
        "numero": "26.5",
        "titulo": "Informação e treinamento",
        "explicacao": "A empresa deve garantir que os trabalhadores tenham acesso às fichas de segurança dos produtos que manuseiam, e treiná-los para entender rótulos, riscos, medidas preventivas e o que fazer em caso de emergência."
      }
    ]
  },
  "NR-27": {
    "titulo": "Registro Profissional do Técnico de Segurança do Trabalho",
    "status": "revogada",
    "observacao": "A NR-27 teve sua redação vigente (dada pela Portaria SSST nº 13/1995) revogada pela Portaria MTE nº 262, de 29/05/2008. Hoje o assunto 'registro profissional do técnico de segurança do trabalho' é regido diretamente pela Lei nº 7.410/1985, pelo Decreto nº 92.530/1986 e pelos órgãos de registro profissional, não mais por Norma Regulamentadora."
  },
  "NR-28": {
    "titulo": "Fiscalização e Penalidades",
    "status": "ativa",
    "resumo": "Essa norma não traz regras técnicas de prevenção de acidentes; ela organiza como funciona a fiscalização do trabalho em segurança e saúde ocupacional e como são aplicadas as penalidades quando uma empresa descumpre uma NR. É voltada principalmente para o Auditor-Fiscal do Trabalho, mas todo técnico de segurança precisa conhecê-la para entender prazos de notificação, o que é embargo/interdição e como as multas são calculadas.",
    "itens": [
      {
        "numero": "28.1.1 a 28.1.3",
        "titulo": "Base legal e lavratura do auto de infração",
        "explicacao": "A fiscalização tem base na CLT e em outras normas legais. Quando o fiscal constata descumprimento de uma NR, ele lavra um auto de infração, respeitando em regra o critério da dupla visita (uma visita orientativa antes da autuação, em certos casos)."
      },
      {
        "numero": "28.1.4",
        "titulo": "Notificação e prazos para correção",
        "explicacao": "Em vez de autuar de imediato, o fiscal pode notificar a empresa e dar um prazo para corrigir a irregularidade. O prazo padrão é de até 60 dias, podendo ser prorrogado pela autoridade regional por até 120 dias mediante pedido justificado; prazos maiores exigem negociação com o sindicato da categoria."
      },
      {
        "numero": "28.1.5",
        "titulo": "Auto de infração com base em laudo técnico",
        "explicacao": "O agente de fiscalização pode lavrar o auto de infração usando como prova um laudo técnico emitido por engenheiro ou médico do trabalho habilitado, e não apenas sua observação direta."
      },
      {
        "numero": "28.2",
        "titulo": "Embargo e interdição",
        "explicacao": "Quando há risco grave e iminente à vida ou saúde do trabalhador, o fiscal propõe à autoridade regional a interdição (de um estabelecimento, setor, máquina ou equipamento) ou o embargo (de uma obra), indicando as medidas que precisam ser corrigidas para liberar a atividade."
      },
      {
        "numero": "28.2.3",
        "titulo": "Descumprimento reiterado",
        "explicacao": "Se a empresa repete a mesma irregularidade (por exemplo, recebe três autos pelo mesmo item) ou ignora advertências, a autoridade pode convocar o representante legal da empresa para apurar o caso e cobrar uma solução definitiva."
      },
      {
        "numero": "28.3",
        "titulo": "Penalidades e gradação de multas",
        "explicacao": "As multas seguem uma tabela de gradação (Anexo I) combinada com a classificação de gravidade de cada infração (Anexo II), que lista, para cada NR, o código e o grau de severidade do descumprimento. Em casos de reincidência, embaraço à fiscalização ou fraude, a multa pode ser aplicada em valor fixo mais alto, conforme a CLT."
      }
    ]
  },
  "NR-29": {
    "titulo": "Segurança e Saúde no Trabalho Portuário",
    "status": "ativa",
    "resumo": "Essa norma regula a segurança do trabalho realizado a bordo de embarcações e em terra, em portos e instalações portuárias, públicas ou privadas. Ela se aplica a operadores portuários, ao Órgão Gestor de Mão de Obra (OGMO), a empregadores de trabalhadores portuários avulsos e às empresas que atuam dentro e fora da área do porto organizado, cobrindo desde a atracação de navios até a movimentação de cargas perigosas.",
    "itens": [
      {
        "numero": "29.1 e 29.2",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "A norma existe para prevenir acidentes e doenças no trabalho portuário e orientar o gerenciamento de riscos ocupacionais. Ela cobre o trabalho a bordo e em terra em portos e terminais, inclusive retroportuários."
      },
      {
        "numero": "29.3 e 29.4",
        "titulo": "Responsabilidades e PGR",
        "explicacao": "A norma distribui obrigações entre operador portuário, tomador de serviço, empregador, OGMO, administração do porto e o trabalhador avulso, incluindo o fornecimento e uso correto de EPI. Cada um desses atores precisa manter seu Programa de Gerenciamento de Riscos (PGR), com as informações de risco acessíveis aos trabalhadores."
      },
      {
        "numero": "29.7",
        "titulo": "CPATP (comissão paritária)",
        "explicacao": "É uma comissão formada por representantes dos trabalhadores e do empregador, com mandato de dois anos, que se reúne mensalmente e, de forma extraordinária e rápida (em 48 horas), quando ocorre acidente grave ou fatal."
      },
      {
        "numero": "29.8 a 29.11",
        "titulo": "Atracação, acesso e áreas da embarcação",
        "explicacao": "Define regras para a atracação segura do navio, formas seguras de subir e descer da embarcação (proibindo, por exemplo, usar o guindaste como meio de acesso, salvo exceções), e cuidados em conveses e porões, como guarda-corpos e isolamento de áreas de risco de queda de objetos."
      },
      {
        "numero": "29.13 e 29.14",
        "titulo": "Máquinas e guindastes",
        "explicacao": "Equipamentos usados na movimentação de carga, como guindastes de bordo, precisam seguir a NR-12, ter capacidade de carga visível, operador capacitado e passar por inspeções registradas, mantidas por cinco anos."
      },
      {
        "numero": "29.15 a 29.17",
        "titulo": "Movimentação de cargas e contêineres",
        "explicacao": "Traz regras específicas para içar e descer cargas com segurança, incluindo proibição de ficar embaixo de carga suspensa, exigência de sinaleiro capacitado e cuidados especiais para contêineres e granéis secos."
      },
      {
        "numero": "29.26 a 29.29",
        "titulo": "Primeiros socorros e planos de emergência",
        "explicacao": "Exige serviço de urgência, presença de socorrista nos berços de atracação, um Plano de Controle de Emergência (com simulados ao menos três vezes por ano) e, quando aplicável, um Plano de Ajuda Mútua entre empresas vizinhas, com reuniões e simulados periódicos."
      }
    ]
  },
  "NR-30": {
    "titulo": "Segurança e Saúde no Trabalho Aquaviário",
    "status": "ativa",
    "resumo": "Essa norma cuida da segurança e da saúde de quem trabalha embarcado, em navios e outras embarcações comerciais de bandeira nacional ou estrangeira que operam no Brasil, incluindo a pesca comercial em anexo próprio. Ela trata desde as condições de vida a bordo (alojamento, alimentação, instalações sanitárias) até a movimentação de carga, manutenção durante a operação do navio e treinamento da tripulação.",
    "itens": [
      {
        "numero": "30.1 e 30.2",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "Estabelece requisitos para proteger a segurança e a saúde a bordo e prevenir lesões e doenças relacionadas ao trabalho aquaviário. Aplica-se a embarcações comerciais nacionais e estrangeiras, com regra especial para embarcações de pesca (seguem apenas o anexo da norma)."
      },
      {
        "numero": "30.4",
        "titulo": "PGRTA (Programa de Gerenciamento de Riscos do Trabalho Aquaviário)",
        "explicacao": "Cada embarcação deve ter seu próprio programa de gerenciamento de riscos, cobrindo manutenção durante a operação, condições climáticas extremas, movimentação de carga e manobras de atracação. Deve ser revisado a cada três anos ou quando houver mudança relevante."
      },
      {
        "numero": "30.6 e 30.7",
        "titulo": "CIPA e GSSTB",
        "explicacao": "A CIPA a bordo tem composição e eleição próprias para trabalhadores aquaviários. Em embarcações nacionais de 500 AB (arqueação bruta) ou mais, é obrigatório também um Grupo de Segurança e Saúde no Trabalho a Bordo (GSSTB), que atua sob orientação do SESMT e responsabilidade do comandante."
      },
      {
        "numero": "30.8 a 30.13",
        "titulo": "Condições de vida a bordo",
        "explicacao": "Regula alimentação e água potável, dimensões e padrão dos camarotes, salões de recreio, cozinha, instalações sanitárias e lavagem de roupa, variando as exigências conforme o porte da embarcação."
      },
      {
        "numero": "30.14",
        "titulo": "Manutenção com a embarcação em operação",
        "explicacao": "Serviços de manutenção só podem ocorrer com Análise de Risco e Permissão de Trabalho (válida por no máximo 24 horas), e devem ser interrompidos se o vento ultrapassar 20 nós ou as ondas passarem de 2,5 metros. Trabalho em espaço confinado segue a NR-33 e trabalho em altura segue a NR-35."
      },
      {
        "numero": "30.15 e 30.16",
        "titulo": "Movimentação de carga e máquinas",
        "explicacao": "Equipamentos de movimentação de carga precisam de certificação renovada a cada 5 anos, inspeção periódica (até 12 meses) e relatórios registrados. Máquinas em geral seguem a NR-12, com exceções para equipamentos já certificados por norma marítima."
      },
      {
        "numero": "30.17",
        "titulo": "Capacitação",
        "explicacao": "Exige certificado de capacitação para quem opera máquinas e equipamentos, com treinamento inicial presencial de pelo menos 4 horas e reciclagem a cada 2 anos."
      },
      {
        "numero": "30.18",
        "titulo": "Acesso à embarcação",
        "explicacao": "Define regras para subir e descer da embarcação com segurança — escadas, pranchas, portaló com ângulo máximo de 55°, corrimãos e proibição de usar o guindaste como meio de acesso (salvo resgate)."
      }
    ]
  },
  "NR-31": {
    "titulo": "Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura",
    "status": "ativa",
    "resumo": "É a norma que organiza a segurança do trabalho rural, cobrindo lavoura, criação de animais, plantio e corte de árvores e criação de peixes/aquicultura. Ela estabelece obrigações do empregador rural e dos trabalhadores, cria programas e comissões próprios do setor rural e detalha riscos típicos dessa atividade, como uso de agrotóxicos, máquinas agrícolas e transporte de trabalhadores em áreas rurais.",
    "itens": [
      {
        "numero": "31.2",
        "titulo": "Campo de aplicação e obrigações gerais",
        "explicacao": "A norma vale para agricultura, pecuária, silvicultura, exploração florestal e aquicultura. O empregador deve garantir condições seguras, informar riscos e analisar as causas de acidentes; o trabalhador deve seguir as ordens de serviço e não desativar proteções de máquinas. Os trabalhadores também têm direito de interromper a atividade em caso de risco grave e iminente, sem punição."
      },
      {
        "numero": "31.3",
        "titulo": "PGRTR (Programa de Gerenciamento de Riscos no Trabalho Rural)",
        "explicacao": "Programa obrigatório por estabelecimento rural, que identifica perigos, avalia riscos e define medidas de prevenção em ordem de prioridade (eliminar o risco, proteção coletiva, medidas administrativas e, por último, EPI). Deve ser revisado a cada 3 anos ou quando houver mudança relevante, e inclui cuidados específicos como trabalho com animais, clima extremo e linhas de energia."
      },
      {
        "numero": "31.4",
        "titulo": "SESTR (Serviço Especializado em Segurança e Saúde no Trabalho Rural)",
        "explicacao": "É obrigatório a partir de 51 trabalhadores, podendo ser organizado de forma individual ou compartilhada entre estabelecimentos próximos ou do mesmo grupo. Pode ser formado por médico, engenheiro, técnico de segurança e enfermeiro do trabalho, dependendo do porte."
      },
      {
        "numero": "31.5",
        "titulo": "CIPATR",
        "explicacao": "É a comissão interna de prevenção de acidentes do trabalho rural, obrigatória a partir de 20 empregados, com representantes eleitos dos trabalhadores e indicados pelo empregador, mandato de dois anos e reuniões bimestrais."
      },
      {
        "numero": "31.6",
        "titulo": "Equipamentos de proteção individual",
        "explicacao": "O empregador deve fornecer gratuitamente EPI adequado ao risco rural, como protetor solar, perneira contra animais peçonhentos e vestimenta impermeável, além de exigir e fiscalizar o uso correto."
      },
      {
        "numero": "31.7",
        "titulo": "Agrotóxicos e produtos afins",
        "explicacao": "Proíbe o uso de produtos não registrados e a manipulação por menores de 18 anos, maiores de 60, gestantes e lactantes. Exige capacitação de no mínimo 20 horas para quem tem exposição direta, uso de EPI, banho obrigatório após a aplicação e armazenamento em local isolado de moradias e alimentos."
      },
      {
        "numero": "31.9",
        "titulo": "Transporte de trabalhadores",
        "explicacao": "O transporte coletivo de trabalhadores rurais precisa de autorização do órgão de trânsito, vistoria anual, passageiros sentados e motorista habilitado; veículos adaptados só podem ser usados em situações excepcionais, com requisitos mínimos de segurança."
      },
      {
        "numero": "31.12",
        "titulo": "Máquinas, equipamentos e implementos agrícolas",
        "explicacao": "Exige que máquinas sejam operadas só por trabalhadores capacitados, com comandos protegidos contra acionamento acidental e estruturas de proteção contra capotagem e queda de objetos. Motosserras exigem treinamento específico de 16 horas, e roçadeiras, de 4 horas."
      }
    ]
  },
  "NR-32": {
    "titulo": "Segurança e Saúde no Trabalho em Serviços de Saúde",
    "status": "ativa",
    "resumo": "Essa norma protege quem trabalha em hospitais, clínicas, laboratórios e qualquer local onde se prestam serviços de saúde (assistência, pesquisa ou ensino). Ela trata principalmente dos riscos biológicos (contato com sangue e material contaminado), mas também cobre riscos químicos, radiações ionizantes, ergonomia, vacinação dos profissionais e descarte correto de resíduos de saúde.",
    "itens": [
      {
        "numero": "32.1",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "Estabelece diretrizes básicas de proteção à segurança e à saúde de trabalhadores de serviços de saúde, entendidos como qualquer edificação destinada à assistência, promoção, recuperação, ensino ou pesquisa em saúde."
      },
      {
        "numero": "32.2",
        "titulo": "Risco biológico",
        "explicacao": "Define os agentes biológicos e exige medidas como lavatórios exclusivos, vedação de postos de trabalho, uso de EPI e descarte seguro de material perfurocortante — sendo proibido reencapar ou desconectar agulhas manualmente, justamente para evitar acidentes com picada."
      },
      {
        "numero": "32.3",
        "titulo": "Risco químico",
        "explicacao": "Trata de rotulagem de produtos, uso de medicamentos de risco (como quimioterápicos antineoplásicos, que exigem cabine de segurança biológica), gases medicinais e gases anestésicos, prevendo o afastamento de gestantes em certas situações."
      },
      {
        "numero": "32.4",
        "titulo": "Radiações ionizantes",
        "explicacao": "Exige Plano de Proteção Radiológica, monitoração individual (dosimetria) dos profissionais expostos e manutenção dos registros de dose por até 30 anos, com regras específicas para radioterapia, medicina nuclear e radiodiagnóstico."
      },
      {
        "numero": "32.5",
        "titulo": "Resíduos de serviços de saúde",
        "explicacao": "Define como segregar, acondicionar, transportar e armazenar os resíduos (incluindo perfurocortantes e rejeitos radioativos), com regras como não encher demais os sacos e recipientes."
      },
      {
        "numero": "32.2.4.17",
        "titulo": "Vacinação",
        "explicacao": "A empresa deve oferecer gratuitamente imunização contra tétano, difteria e hepatite B, e demais vacinas previstas no PCMSO, registrando no prontuário do trabalhador a vacinação ou a eventual recusa."
      },
      {
        "numero": "32.10",
        "titulo": "Ergonomia e outros riscos",
        "explicacao": "Trata de organização dos postos de trabalho para evitar esforço excessivo, equipamentos para reduzir o esforço na movimentação de pacientes, conforto térmico, ruído e iluminação, além de proibir práticas de risco como pipetar com a boca."
      }
    ]
  },
  "NR-33": {
    "titulo": "Segurança e Saúde nos Trabalhos em Espaços Confinados",
    "status": "ativa",
    "resumo": "Essa norma estabelece os requisitos mínimos para identificar espaços confinados (locais não projetados para ocupação humana contínua, com entrada e saída limitadas e risco de atmosfera perigosa) e para reconhecer, avaliar e controlar os riscos desses ambientes. Ela se aplica a qualquer estabelecimento que tenha espaços confinados, exigindo autorização formal, medição de atmosfera e um sistema rígido de permissão antes de qualquer entrada.",
    "itens": [
      {
        "numero": "33.1.1",
        "titulo": "Objetivo e definições",
        "explicacao": "A norma visa proteger trabalhadores que atuam direta ou indiretamente em espaços confinados. Define espaço confinado como área não projetada para ocupação humana contínua, com meios limitados de entrada e saída e ventilação insuficiente para remover contaminantes ou poder haver falta/excesso de oxigênio."
      },
      {
        "numero": "33.2.1 e 33.2.2",
        "titulo": "Responsabilidades do empregador e do trabalhador",
        "explicacao": "O empregador deve indicar formalmente um Responsável Técnico, identificar os espaços confinados, garantir capacitação e exigir a Permissão de Entrada e Trabalho (PET) antes de qualquer acesso. O trabalhador deve usar corretamente os equipamentos, seguir os procedimentos recebidos no treinamento e comunicar situações de risco."
      },
      {
        "numero": "33.3.3",
        "titulo": "Permissão de Entrada e Trabalho (PET)",
        "explicacao": "É um documento obrigatório antes de qualquer entrada em espaço confinado, preenchido em no mínimo três vias, válido para uma única entrada (não pode ser revalidado) e que precisa ser arquivado por pelo menos cinco anos junto com os procedimentos de trabalho."
      },
      {
        "numero": "33.3.5",
        "titulo": "Capacitação",
        "explicacao": "Vigias e Trabalhadores Autorizados precisam de treinamento inicial de no mínimo 16 horas, e Supervisores de Entrada, de 40 horas, sempre presencial (não é permitido curso a distância). A reciclagem é anual, com carga mínima de 8 horas."
      },
      {
        "numero": "33.3.2",
        "titulo": "Medição da atmosfera",
        "explicacao": "Antes de qualquer entrada, a atmosfera deve ser testada fora do espaço confinado (topo, meio e fundo, em acessos verticais) usando equipamento multigás (oxigênio, explosividade, monóxido de carbono e gás sulfídrico), e o monitoramento deve continuar durante toda a permanência dos trabalhadores."
      },
      {
        "numero": "33.3.4",
        "titulo": "O vigia",
        "explicacao": "É o profissional que fica do lado de fora do espaço confinado, em comunicação constante com quem está dentro, controlando quantas pessoas entraram e saíram, e que deve acionar o resgate em caso de emergência. Ele não pode entrar no espaço nem fazer outra tarefa ao mesmo tempo."
      },
      {
        "numero": "33.4",
        "titulo": "Emergência e salvamento",
        "explicacao": "A empresa precisa ter procedimentos de resgate prontos e uma equipe de salvamento capacitada e apta fisicamente, com pelo menos um simulado de emergência por ano."
      }
    ]
  },
  "NR-34": {
    "titulo": "Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval",
    "status": "ativa",
    "resumo": "Essa norma regula a segurança em estaleiros e outras instalações onde se constrói, repara ou desmonta embarcações e estruturas navais (navios, plataformas fixas ou flutuantes). Ela cobre desde o trabalho a quente (solda e corte) e o trabalho em altura até jateamento, pintura, movimentação de cargas e montagem de andaimes, exigindo documentação como Análise Preliminar de Risco e Permissão de Trabalho.",
    "itens": [
      {
        "numero": "34.1",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "Estabelece requisitos mínimos de segurança, saúde e meio ambiente de trabalho na construção, reparação e desmonte naval, abrangendo tanto as instalações do estaleiro quanto o trabalho dentro das próprias embarcações."
      },
      {
        "numero": "34.2",
        "titulo": "Responsabilidades do empregador",
        "explicacao": "O empregador deve designar formalmente um responsável pela implementação da norma, adotar medidas de proteção antes de qualquer trabalho, providenciar a Análise Preliminar de Risco (APR) e a Permissão de Trabalho (PT) quando necessário, e realizar o Diálogo Diário de Segurança (DDS) antes das atividades."
      },
      {
        "numero": "34.3",
        "titulo": "Capacitação e treinamento",
        "explicacao": "Exige treinamento admissional de no mínimo 6 horas e treinamento periódico de no mínimo 4 horas por ano (ou após afastamento maior que 90 dias), sempre dentro do horário de trabalho e com material didático entregue ao trabalhador."
      },
      {
        "numero": "34.5",
        "titulo": "Trabalho a quente",
        "explicacao": "Atividades como solda e corte exigem inspeção e liberação prévia da área, proteção contra incêndio, controle de fumos e gases, e cuidados com cilindros de gás (proibidos em espaços confinados)."
      },
      {
        "numero": "34.6",
        "titulo": "Trabalho em altura",
        "explicacao": "Aplica as regras da NR-35, com a exigência adicional de interromper o trabalho quando a iluminação for insuficiente ou o vento ultrapassar 40 km/h, além de regras específicas para escadas, plataformas e acesso por corda (equipe mínima de três pessoas)."
      },
      {
        "numero": "34.8",
        "titulo": "Jateamento e hidrojateamento",
        "explicacao": "Só pode ser feito por trabalhador capacitado, com mangueiras reforçadas, aterramento e revezamento de operadores para evitar fadiga; é proibido jateamento com areia contendo sílica acima do limite permitido."
      },
      {
        "numero": "34.10",
        "titulo": "Movimentação de cargas",
        "explicacao": "Só pode ser operada por trabalhador capacitado e autorizado, com equipamentos certificados por profissional habilitado, checklist diário de inspeção e uso de sinaleiro e comunicação por rádio nas manobras."
      },
      {
        "numero": "34.11",
        "titulo": "Montagem e desmontagem de andaimes",
        "explicacao": "O andaime precisa ser dimensionado por profissional habilitado, ter guarda-corpos e rodapés, e só pode ser liberado para uso depois de uma Ficha de Liberação de Andaime assinada."
      },
      {
        "numero": "34.17",
        "titulo": "Plano de Resposta a Emergências (PRE)",
        "explicacao": "Define cenários de emergência e as atribuições de cada equipe, exige simulados periódicos com relatório e revisão do plano a cada dois anos."
      }
    ]
  },
  "NR-35": {
    "titulo": "Trabalho em Altura",
    "status": "ativa",
    "resumo": "Essa norma estabelece os requisitos mínimos para proteger quem trabalha em altura, ou seja, em qualquer atividade com diferença de nível superior a 2 metros em relação ao ponto mais baixo, onde haja risco de queda. Ela se aplica a todas as atividades e setores econômicos e cobre o planejamento, a organização e a execução do trabalho em altura, exigindo autorização formal, treinamento específico, análise de risco, permissão de trabalho e sistemas de proteção contra quedas.",
    "itens": [
      {
        "numero": "35.2",
        "titulo": "Campo de aplicação",
        "explicacao": "A norma se aplica a toda atividade executada acima de 2 metros do nível inferior, onde haja risco de queda. Não importa o setor da empresa: se existe essa condição, a NR-35 precisa ser seguida."
      },
      {
        "numero": "35.3",
        "titulo": "Responsabilidades",
        "explicacao": "Cabe à organização implementar as medidas de prevenção, fazer a Análise de Risco, emitir Permissão de Trabalho quando necessário, autorizar formalmente os trabalhadores e guardar a documentação por pelo menos 5 anos. O trabalhador deve seguir a norma e os procedimentos operacionais estabelecidos."
      },
      {
        "numero": "35.4",
        "titulo": "Autorização, capacitação e aptidão",
        "explicacao": "Nenhum trabalhador pode subir em altura sem autorização formal da empresa. O treinamento inicial tem no mínimo 8 horas e deve ser repetido a cada 2 anos (reciclagem), também de pelo menos 8 horas; além disso, é preciso avaliação de saúde (ASO) atestando aptidão para esse tipo de trabalho."
      },
      {
        "numero": "35.5",
        "titulo": "Planejamento, organização e execução",
        "explicacao": "Segue uma ordem de prioridade: primeiro tentar evitar o trabalho em altura, depois eliminar o risco de queda e, por último, minimizar as consequências de uma eventual queda. Toda atividade deve ser precedida de uma Análise de Risco, e atividades não rotineiras exigem Permissão de Trabalho prévia."
      },
      {
        "numero": "35.5.5.1",
        "titulo": "Análise de Risco (AR)",
        "explicacao": "Antes de começar o trabalho, é preciso avaliar fatores como o local e seu entorno, as condições climáticas, o estado das ancoragens, o risco de queda de materiais e o plano de emergência e resgate, entre outros pontos."
      },
      {
        "numero": "35.6",
        "titulo": "Sistemas de Proteção Contra Quedas (SPQ)",
        "explicacao": "Sempre que não for possível evitar o trabalho em altura, é obrigatório usar sistema de proteção. Dá-se prioridade ao sistema coletivo (como guarda-corpos); o sistema individual (cinto de segurança tipo paraquedista com talabarte) só é usado quando o coletivo não é viável, com inspeção periódica obrigatória no máximo a cada 12 meses."
      },
      {
        "numero": "35.7",
        "titulo": "Emergência e salvamento",
        "explicacao": "A empresa precisa ter procedimentos de resposta a emergências, com uma equipe de resgate dimensionada e capacitada, e um plano que reduza o tempo em que o trabalhador fica suspenso após uma queda (o que ajuda a evitar a chamada 'síndrome do arnês')."
      }
    ]
  },
  "NR-36": {
    "titulo": "Segurança e Saúde no Trabalho em Empresas de Abate e Processamento de Carnes e Derivados",
    "status": "ativa",
    "resumo": "Essa norma é voltada para frigoríficos e empresas de abate e processamento de carnes, um setor com alto índice de lesões por esforço repetitivo e exposição ao frio. Ela regula desde o mobiliário dos postos de trabalho e o ritmo de produção até o uso de EPI térmico, pausas obrigatórias e análise ergonômica, com o objetivo de reduzir doenças ocupacionais relacionadas a movimentos repetitivos e ambientes frios.",
    "itens": [
      {
        "numero": "36.1",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "Estabelece requisitos mínimos para avaliar, controlar e monitorar os riscos específicos da indústria de abate e processamento de carnes e derivados, sem excluir a aplicação complementar das demais NRs."
      },
      {
        "numero": "36.2",
        "titulo": "Mobiliário e postos de trabalho",
        "explicacao": "Os postos devem ser dimensionados para atender cerca de 95% dos trabalhadores, alternando trabalho sentado e em pé, com assentos disponíveis para pelo menos um a cada três trabalhadores em postos fixos, além de pisos antiderrapantes e câmaras frias com abertura pelo interior e alarme."
      },
      {
        "numero": "36.4 e 36.5",
        "titulo": "Ergonomia e manuseio de produtos",
        "explicacao": "Exige redução de esforços por meios técnicos e organizacionais, proíbe o carregamento manual de peças pesadas ou volumosas e busca mecanizar o transporte sempre que for tecnicamente viável, além de controlar a frequência de movimentos repetitivos."
      },
      {
        "numero": "36.9",
        "titulo": "Condições ambientais de trabalho",
        "explicacao": "Trata de ruído, qualidade do ar, agentes químicos e biológicos, e conforto térmico, com atenção especial a câmaras frias: ambientes com -18°C ou menos precisam indicar o tempo máximo de permanência do trabalhador."
      },
      {
        "numero": "36.10",
        "titulo": "EPI e vestimentas",
        "explicacao": "A empresa deve fornecer equipamentos de proteção individual e vestimentas adequadas, incluindo isolamento térmico para quem trabalha em ambientes frios."
      },
      {
        "numero": "36.13",
        "titulo": "Organização temporal do trabalho e pausas",
        "explicacao": "Regula jornada, pausas adicionais e limites de tempo de exposição em locais frigorificados, para reduzir o desgaste físico acumulado ao longo do turno."
      },
      {
        "numero": "36.15",
        "titulo": "Análise Ergonômica do Trabalho (AET)",
        "explicacao": "Serve de base para avaliar posturas, força exigida, repetitividade e necessidade de pausas em cada posto de trabalho, orientando as melhorias que a empresa deve implementar."
      },
      {
        "numero": "36.16",
        "titulo": "Informação e treinamento",
        "explicacao": "A empresa deve capacitar e informar os trabalhadores sobre os riscos do setor e as medidas de controle adotadas."
      }
    ]
  },
  "NR-37": {
    "titulo": "Segurança e Saúde em Plataformas de Petróleo",
    "status": "ativa",
    "resumo": "Essa norma regula a segurança e as condições de vida a bordo de plataformas de petróleo (fixas ou flutuantes) que operam em águas jurisdicionais brasileiras, incluindo unidades de manutenção e segurança. Ela cobre desde o transporte de trabalhadores até a plataforma (por helicóptero, embarcação ou transferência por cesta) até alojamento, alimentação, gerenciamento de riscos e resposta a emergências em alto-mar.",
    "itens": [
      {
        "numero": "37.1 e 37.2",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "Estabelece requisitos de segurança, saúde e condições de vivência a bordo de plataformas de petróleo nacionais e estrangeiras operando no Brasil, excluindo embarcações de apoio marítimo, de levantamento sísmico e de mergulho."
      },
      {
        "numero": "37.3 e 37.4",
        "titulo": "Responsabilidades e direitos dos trabalhadores",
        "explicacao": "Divide responsabilidades entre a operadora da instalação, a operadora do contrato e as empresas prestadoras de serviço. O trabalhador tem direito de interromper a tarefa diante de risco grave e iminente e de comunicar riscos que possam gerar um acidente ampliado."
      },
      {
        "numero": "37.5",
        "titulo": "Gerenciamento de riscos (PGR)",
        "explicacao": "Cada plataforma precisa ter seu próprio Programa de Gerenciamento de Riscos, com inventário de riscos e plano de ação, além de análise preliminar de risco e permissão de trabalho para atividades não rotineiras."
      },
      {
        "numero": "37.6 e 37.7",
        "titulo": "Atenção à saúde e SESMT",
        "explicacao": "Exige PCMSO por plataforma, equipe de saúde conforme o número de trabalhadores embarcados e possibilidade de remoção por aeronave (EVAM) em emergências médicas. O SESMT é constituído tanto em terra quanto a bordo, com dimensionamento conforme o número de trabalhadores."
      },
      {
        "numero": "37.8",
        "titulo": "CIPLAT (comissão interna)",
        "explicacao": "É a comissão interna de prevenção de acidentes das plataformas, constituída por turma de embarque, com representantes eleitos e reuniões mensais."
      },
      {
        "numero": "37.9",
        "titulo": "Capacitação e treinamento",
        "explicacao": "Todo trabalhador recebe um briefing de embarque e treinamento básico (mínimo 6 horas) ou avançado (mínimo 8 horas), com reciclagem a cada 5 anos e Diálogo Diário de Segurança antes das atividades."
      },
      {
        "numero": "37.11",
        "titulo": "Acesso à plataforma",
        "explicacao": "Define as formas seguras de chegar à plataforma: helicóptero, embarcação (com limite de distância e de condições de mar) ou transferência por gangway ou cesta, cada uma com seus próprios requisitos de segurança."
      },
      {
        "numero": "37.12 e 37.13",
        "titulo": "Condições de vivência e alimentação",
        "explicacao": "Regula alojamento, instalações sanitárias, refeitório, cozinha e lavanderia a bordo, além de garantir alimentação gratuita, cardápio adequado e inspeções semanais das condições de higiene."
      },
      {
        "numero": "37.28",
        "titulo": "Plano de Resposta a Emergências (PRE)",
        "explicacao": "Exige um plano formal para emergências, com simulados periódicos, já que o isolamento geográfico de uma plataforma torna o resgate muito mais complexo do que em terra."
      }
    ]
  },
  "NR-38": {
    "titulo": "Segurança e Saúde no Trabalho nas Atividades de Limpeza Urbana e Manejo de Resíduos Sólidos",
    "status": "ativa",
    "resumo": "Esta NR não trata de teleatendimento/telemarketing (tema que continua regulado pelo Anexo II da NR-17). O número 38 foi oficializado pela Portaria MTP nº 4.101/2022, com vigência desde 02/01/2024, para regular a segurança de quem trabalha em coleta de lixo, varrição, capina e poda, limpeza de bueiros e praias, triagem de recicláveis e disposição final de resíduos sólidos urbanos. Ela cobre desde o uso seguro do caminhão coletor-compactador até vacinação, EPI e capacitação dos garis e coletores.",
    "itens": [
      {
        "numero": "38.1 e 38.2",
        "titulo": "Objetivo e campo de aplicação",
        "explicacao": "Estabelece requisitos e medidas de prevenção para trabalhadores de limpeza urbana e manejo de resíduos sólidos, cobrindo coleta, transporte, varrição, capina, poda, limpeza de bueiros e praias e triagem de recicláveis. Fica fora do alcance da norma o resíduo industrial, de saneamento, de construção civil, agrossilvopastoril, de transporte e de mineração."
      },
      {
        "numero": "38.3",
        "titulo": "Gerenciamento de riscos e disposições gerais",
        "explicacao": "Exige registro atualizado das rotas e pontos de apoio para avaliação ergonômica, pontos de apoio com banheiro e local de refeição, água potável nas rotas, e um procedimento de segurança para riscos de trânsito durante a coleta."
      },
      {
        "numero": "38.4",
        "titulo": "Riscos biológicos",
        "explicacao": "Exige PCMSO com programa de imunização (especialmente tétano e hepatite B), registro de vacinação ou recusa no prontuário e procedimento específico para acidentes com material perfurocortante encontrado no lixo."
      },
      {
        "numero": "38.5 e 38.6",
        "titulo": "Veículos, máquinas e plataforma operacional",
        "explicacao": "O caminhão coletor-compactador precisa ter câmera, sinalizadores, sinal sonoro e botão de parada de emergência. É proibido transportar trabalhadores na parte externa do veículo, e a plataforma onde o coletor se apoia tem velocidade máxima de 10 km/h, com subida e descida apenas com o veículo parado."
      },
      {
        "numero": "38.8",
        "titulo": "Poda de árvores",
        "explicacao": "Exige Análise de Risco e Permissão de Trabalho antes da atividade, capacitação prévia do trabalhador e proíbe a escalada livre da árvore (sem equipamento de proteção)."
      },
      {
        "numero": "38.9",
        "titulo": "Capacitação",
        "explicacao": "O treinamento inicial tem parte teórica e prática, cada uma com 4 horas, cobrindo direito de recusa diante de risco, uso de EPI, ergonomia e primeiros socorros. Nos primeiros 10 dias de trabalho, o coletor ou varredor novo deve atuar ao lado de alguém mais experiente."
      },
      {
        "numero": "38.10",
        "titulo": "EPI e vestimentas",
        "explicacao": "A empresa deve fornecer gratuitamente EPI e vestimentas, incluindo proteção solar para atividades a céu aberto e ao menos duas vestimentas com sinalização refletiva, trocadas a cada seis meses; para coleta de resíduos, exige calçado de segurança e luvas resistentes a corte e perfuração."
      }
    ]
  }
};

const MULTAS_DADOS = {
  "fonteLegal": "NR-28 (Fiscalização e Penalidades), Anexo I (gradação de multas por faixa de empregados e grau) e Anexo II (classificação de infrações por NR/item/código/grau/tipo), conforme Portaria MTE nº 104/2026 (DOU 30/01/2026, retificada 19/02/2026). Tetos/pisos gerais de valor monetário atualizados pela Portaria MTE nº 1.131/2025 (reajuste anual previsto no item 28.3.3 da NR-28, com base no art. 634, §2º, da CLT).",
  "faixasEmpregados": [
    {
      "min": 1,
      "max": 10,
      "rotulo": "01 a 10 empregados",
      "chave": "01-10"
    },
    {
      "min": 11,
      "max": 25,
      "rotulo": "11 a 25 empregados",
      "chave": "11-25"
    },
    {
      "min": 26,
      "max": 50,
      "rotulo": "26 a 50 empregados",
      "chave": "26-50"
    },
    {
      "min": 51,
      "max": 100,
      "rotulo": "51 a 100 empregados",
      "chave": "51-100"
    },
    {
      "min": 101,
      "max": 250,
      "rotulo": "101 a 250 empregados",
      "chave": "101-250"
    },
    {
      "min": 251,
      "max": 500,
      "rotulo": "251 a 500 empregados",
      "chave": "251-500"
    },
    {
      "min": 501,
      "max": 1000,
      "rotulo": "501 a 1000 empregados",
      "chave": "501-1000"
    },
    {
      "min": 1001,
      "max": null,
      "rotulo": "mais de 1000 empregados",
      "chave": "mais-1000"
    }
  ],
  "regraReincidencia": "Em caso de reincidência, embaraço ou resistência à fiscalização, ou fraude por artifício ou simulação, a multa é aplicada diretamente no valor máximo da faixa/grau/tipo aplicável (art. 201, parágrafo único, da CLT) — e não uma simples duplicação do valor calculado.",
  "confirmadoTetoPiso2025": {
    "S": {
      "minimo": 693.11,
      "maximo": 6935.56,
      "rotulo": "Segurança do Trabalho"
    },
    "M": {
      "minimo": 415.87,
      "maximo": 4160.89,
      "rotulo": "Medicina do Trabalho"
    }
  },
  "estimadoPorFaixaGrauS": {
    "01-10": {
      "1": [
        670.8,
        775.9
      ],
      "2": [
        1201.84,
        1482.68
      ],
      "3": [
        1799.67,
        2225.78
      ],
      "4": [
        2396.7,
        2971.5
      ]
    },
    "11-25": {
      "1": [
        776.96,
        883.12
      ],
      "2": [
        1483.72,
        1771.19
      ],
      "3": [
        2226.82,
        2655.52
      ],
      "4": [
        2972.55,
        3548.7
      ]
    },
    "26-50": {
      "1": [
        884.16,
        996.17
      ],
      "2": [
        1772.23,
        2059.7
      ],
      "3": [
        2656.56,
        3083.73
      ],
      "4": [
        3549.75,
        4125.47
      ]
    },
    "51-100": {
      "1": [
        1025.98,
        1175.08
      ],
      "2": [
        2060.74,
        2341.58
      ],
      "3": [
        3084.78,
        3515.19
      ],
      "4": [
        4126.51,
        4701.68
      ]
    },
    "101-250": {
      "1": [
        1176.12,
        1321.11
      ],
      "2": [
        2342.62,
        2629.58
      ],
      "3": [
        3516.23,
        3955.62
      ],
      "4": [
        4702.72,
        5265.75
      ]
    },
    "251-500": {
      "1": [
        1322.15,
        1462.56
      ],
      "2": [
        2630.63,
        2924.77
      ],
      "3": [
        3957.73,
        4386.17
      ],
      "4": [
        5266.79,
        5842.95
      ]
    },
    "501-1000": {
      "1": [
        1463.6,
        1604.03
      ],
      "2": [
        2925.81,
        3214.95
      ],
      "3": [
        4387.22,
        4816.72
      ],
      "4": [
        5844.0,
        6420.95
      ]
    },
    "mais-1000": {
      "1": [
        1605.08,
        1751.74
      ],
      "2": [
        3216.0,
        3496.0
      ],
      "3": [
        4817.76,
        5248.27
      ],
      "4": [
        6422.0,
        6935.56
      ]
    }
  },
  "incertezasEAvisos": [
    "Não foi encontrada, nas fontes pesquisadas, uma tabela oficial já publicada cruzando as 8 faixas de empregados x 4 graus x tipo (S/M) em valores de reais já reajustados para 2025/2026 — apenas os tetos/pisos gerais (R$ 693,11 a R$ 6.935,56 para Segurança; R$ 415,87 a R$ 4.160,89 para Medicina) estão confirmados pela Portaria MTE 1.131/2025.",
    "Os valores por faixa/grau em 'estimadoPorFaixaGrauS' foram calculados (não copiados de fonte oficial) aplicando um fator de reajuste (~1,0339) sobre uma tabela histórica de 2022 — tratar como estimativa até confirmação direta no Diário Oficial da União.",
    "Os valores de Medicina do Trabalho (tipo M) por faixa/grau são derivados dos valores de Segurança (tipo S) pela mesma proporção observada entre os tetos confirmados de 2025 (M ≈ 60% de S) — também são estimativas, não valores oficiais publicados item a item.",
    "Os itens por NR (código/grau/tipo) vieram de uma compilação de terceiros do Anexo II da NR-28 e são uma amostra, não uma lista exaustiva — sobretudo NR-12 e NR-17, que têm listas de itens muito mais extensas na norma real."
  ],
  "itensPorNr": {
    "NR-1": [
      {
        "item": "1.4.1, alínea a",
        "codigo": "101012-3",
        "grau": 4,
        "tipo": "S",
        "descricao": "Infração a dever do empregador no PGR (gestão de riscos ocupacionais)"
      },
      {
        "item": "1.4.4, alíneas a a e",
        "codigo": "101020-4",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento de obrigações documentais do PGR"
      },
      {
        "item": "1.6.4",
        "codigo": "101030-1",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento relativo a capacitação/treinamento geral de SST"
      },
      {
        "item": "1.7.2.1",
        "codigo": "101036-0",
        "grau": 4,
        "tipo": "M",
        "descricao": "Infração relativa a obrigações de medicina do trabalho previstas na NR-1"
      },
      {
        "item": "2.2",
        "codigo": "101037-9",
        "grau": 3,
        "tipo": "S",
        "descricao": "Descumprimento de disposição geral de organização de SST (item 2.2 da NR-1)"
      }
    ],
    "NR-4": [
      {
        "item": "4.1",
        "codigo": "104027-8",
        "grau": 4,
        "tipo": "S",
        "descricao": "Não constituir/manter SESMT quando obrigatório"
      },
      {
        "item": "4.5",
        "codigo": "104034-0",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento de dimensionamento do SESMT"
      },
      {
        "item": "4.7",
        "codigo": "104018-9",
        "grau": 1,
        "tipo": "S",
        "descricao": "Falha administrativa relacionada ao SESMT"
      },
      {
        "item": "4.11",
        "codigo": "104040-5",
        "grau": 1,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação leve relacionada ao SESMT"
      },
      {
        "item": "4.17",
        "codigo": "104023-5",
        "grau": 1,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação leve de registro/atuação do SESMT"
      },
      {
        "item": "4.19",
        "codigo": "104025-1",
        "grau": 4,
        "tipo": "S",
        "descricao": "Infração grave relacionada à atuação do SESMT"
      }
    ],
    "NR-5": [
      {
        "item": "5.2",
        "codigo": "205001-3",
        "grau": 4,
        "tipo": "S",
        "descricao": "Não constituir CIPA quando obrigatório"
      },
      {
        "item": "5.6",
        "codigo": "205067-6",
        "grau": 3,
        "tipo": "S",
        "descricao": "Descumprimento do dimensionamento da CIPA"
      },
      {
        "item": "5.10",
        "codigo": "205071-4",
        "grau": 1,
        "tipo": "S",
        "descricao": "Falha leve em obrigação formal relativa à CIPA"
      },
      {
        "item": "5.14.1",
        "codigo": "205104-4",
        "grau": 2,
        "tipo": "S",
        "descricao": "Falha em obrigações de funcionamento/atas da CIPA"
      },
      {
        "item": "5.40, alíneas a a h e j",
        "codigo": "205112-5",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento de atribuições/competências da CIPA"
      },
      {
        "item": "5.43",
        "codigo": "205098-6",
        "grau": 3,
        "tipo": "S",
        "descricao": "Descumprimento relativo a treinamento de cipeiros"
      }
    ],
    "NR-6": [
      {
        "item": "6.2",
        "codigo": "206023-0",
        "grau": 4,
        "tipo": "S",
        "descricao": "Não fornecer EPI adequado ao risco (obrigação central da NR-6)"
      },
      {
        "item": "6.3",
        "codigo": "206024-8",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de requisitos de adequação do EPI ao risco/CA"
      },
      {
        "item": "6.6.1, alínea a",
        "codigo": "206005-1",
        "grau": 3,
        "tipo": "S",
        "descricao": "Falha nas obrigações do empregador quanto ao EPI (orientação, substituição)"
      },
      {
        "item": "6.8.1, alíneas a a l",
        "codigo": "206047-7",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de obrigações do empregado quanto ao uso do EPI, exigíveis do empregador"
      },
      {
        "item": "6.9.1",
        "codigo": "206039-6",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação essencial de fornecimento/uso de EPI"
      },
      {
        "item": "6.9.3",
        "codigo": "206032-9",
        "grau": 3,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação acessória relacionada ao fornecimento de EPI"
      }
    ],
    "NR-7": [
      {
        "item": "7.1.3",
        "codigo": "107055-0",
        "grau": 3,
        "tipo": "M",
        "descricao": "Descumprimento de obrigação do PCMSO (planejamento)"
      },
      {
        "item": "7.2.1",
        "codigo": "107089-4",
        "grau": 4,
        "tipo": "M",
        "descricao": "Não elaborar/implementar o PCMSO"
      },
      {
        "item": "7.3.1, alínea a",
        "codigo": "107059-2",
        "grau": 4,
        "tipo": "M",
        "descricao": "Não realizar exames médicos ocupacionais obrigatórios"
      },
      {
        "item": "7.4.7",
        "codigo": "107083-5",
        "grau": 4,
        "tipo": "M",
        "descricao": "Descumprimento grave de exames/ASO previstos no PCMSO"
      },
      {
        "item": "7.4.6.2 e 7.4.6.3",
        "codigo": "107097-5",
        "grau": 1,
        "tipo": "S",
        "descricao": "Falha leve em obrigação documental associada ao PCMSO"
      },
      {
        "item": "7.5.1",
        "codigo": "107045-2",
        "grau": 1,
        "tipo": "M",
        "descricao": "Descumprimento leve de obrigação de medicina do trabalho"
      }
    ],
    "NR-9": [
      {
        "item": "9.1.1",
        "codigo": "109042-9",
        "grau": 4,
        "tipo": "S",
        "descricao": "Não implementar o PGR/avaliação de riscos ambientais (NR-9 integrada à NR-1)"
      },
      {
        "item": "9.1.3",
        "codigo": "109155-7",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação essencial de gestão de riscos"
      },
      {
        "item": "9.2.1.1",
        "codigo": "109048-8",
        "grau": 3,
        "tipo": "S",
        "descricao": "Falha em obrigação relacionada à identificação/avaliação de riscos"
      },
      {
        "item": "9.3.5.1",
        "codigo": "109069-0",
        "grau": 4,
        "tipo": "S",
        "descricao": "Falha em medidas de controle de riscos identificados"
      },
      {
        "item": "9.6.1",
        "codigo": "109039-9",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação documental/registro de riscos"
      },
      {
        "item": "Anexo I, 3.1",
        "codigo": "109087-9",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de requisito específico do Anexo I da NR-9 (riscos relacionados)"
      }
    ],
    "NR-12": [
      {
        "item": "12.1.7",
        "codigo": "312309-0",
        "grau": 3,
        "tipo": "S",
        "descricao": "Descumprimento de disposição geral de segurança em máquinas e equipamentos"
      },
      {
        "item": "12.3.1",
        "codigo": "312322-7",
        "grau": 4,
        "tipo": "S",
        "descricao": "Falha grave em proteção de partes móveis/zonas de perigo"
      },
      {
        "item": "12.4.9",
        "codigo": "312350-2",
        "grau": 1,
        "tipo": "S",
        "descricao": "Falha leve em obrigação documental/sinalização de máquinas"
      },
      {
        "item": "12.5.11, alíneas a a l",
        "codigo": "312380-4",
        "grau": 1,
        "tipo": "S",
        "descricao": "Descumprimento leve de requisito de dispositivo de parada/segurança"
      },
      {
        "item": "12.11.3",
        "codigo": "312436-3",
        "grau": 1,
        "tipo": "S",
        "descricao": "Falha leve em requisito de manutenção/registro de máquinas"
      },
      {
        "item": "12.16.1",
        "codigo": "312475-4",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento de requisito específico de segurança em máquina"
      }
    ],
    "NR-17": [
      {
        "item": "17.1.2",
        "codigo": "117037-6",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação central de ergonomia (AET/avaliação ergonômica)"
      },
      {
        "item": "17.2.4",
        "codigo": "117040-6",
        "grau": 2,
        "tipo": "S",
        "descricao": "Falha em levantamento/transporte manual de cargas"
      },
      {
        "item": "17.3.2.1",
        "codigo": "117010-4",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento de requisito de mobiliário/posto de trabalho"
      },
      {
        "item": "17.5.1",
        "codigo": "117052-0",
        "grau": 3,
        "tipo": "S",
        "descricao": "Descumprimento de requisitos de condições ambientais de trabalho"
      },
      {
        "item": "17.5.2, alíneas a a d",
        "codigo": "117213-1",
        "grau": 4,
        "tipo": "S",
        "descricao": "Falha grave em condições ambientais de trabalho (ruído, iluminação, etc.)"
      },
      {
        "item": "Anexo II, 8.1",
        "codigo": "117178-0",
        "grau": 2,
        "tipo": "M",
        "descricao": "Descumprimento de requisito de ergonomia em teleatendimento/operações (saúde)"
      },
      {
        "item": "Anexo II, 8.1.1",
        "codigo": "117179-8",
        "grau": 1,
        "tipo": "M",
        "descricao": "Falha leve em requisito de saúde associado a operações de teleatendimento"
      }
    ],
    "NR-23": [
      {
        "item": "23.1",
        "codigo": "123093-0",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de obrigação geral de proteção contra incêndio"
      },
      {
        "item": "23.1.1, alíneas a a c",
        "codigo": "123101-4",
        "grau": 3,
        "tipo": "S",
        "descricao": "Falha em medidas de prevenção/combate a incêndio"
      },
      {
        "item": "23.2",
        "codigo": "123097-2",
        "grau": 4,
        "tipo": "S",
        "descricao": "Falha grave em saídas de emergência/rotas de fuga"
      },
      {
        "item": "23.3",
        "codigo": "123098-0",
        "grau": 3,
        "tipo": "S",
        "descricao": "Descumprimento de requisito de sinalização/alarme de incêndio"
      },
      {
        "item": "23.4 e 23.5",
        "codigo": "123102-2",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento de requisitos de equipamentos/sistemas de combate a incêndio"
      }
    ],
    "NR-26": [
      {
        "item": "26.1.1 a 26.1.4",
        "codigo": "126052-9",
        "grau": 2,
        "tipo": "S",
        "descricao": "Descumprimento de requisitos gerais de sinalização de segurança"
      },
      {
        "item": "26.2.1",
        "codigo": "126053-7",
        "grau": 3,
        "tipo": "S",
        "descricao": "Falha em sinalização de cores de segurança"
      },
      {
        "item": "26.2.3",
        "codigo": "126055-3",
        "grau": 4,
        "tipo": "S",
        "descricao": "Descumprimento grave de rotulagem/identificação de produtos químicos"
      },
      {
        "item": "26.2.3.3",
        "codigo": "126049-9",
        "grau": 3,
        "tipo": "S",
        "descricao": "Falha em sub-requisito de rotulagem de produtos químicos"
      },
      {
        "item": "26.2.4",
        "codigo": "126051-0",
        "grau": 3,
        "tipo": "S",
        "descricao": "Falha em FISPQ/ficha de informação de segurança de produtos químicos"
      }
    ]
  },
  "estimadoPorFaixaGrauM": {
    "01-10": {
      "1": [
        402.46,
        465.52
      ],
      "2": [
        721.07,
        889.56
      ],
      "3": [
        1079.75,
        1335.4
      ],
      "4": [
        1437.95,
        1782.81
      ]
    },
    "11-25": {
      "1": [
        466.15,
        529.85
      ],
      "2": [
        890.19,
        1062.66
      ],
      "3": [
        1336.03,
        1593.23
      ],
      "4": [
        1783.44,
        2129.12
      ]
    },
    "26-50": {
      "1": [
        530.47,
        597.67
      ],
      "2": [
        1063.29,
        1235.76
      ],
      "3": [
        1593.86,
        1850.15
      ],
      "4": [
        2129.75,
        2475.16
      ]
    },
    "51-100": {
      "1": [
        615.56,
        705.01
      ],
      "2": [
        1236.38,
        1404.88
      ],
      "3": [
        1850.78,
        2109.01
      ],
      "4": [
        2475.79,
        2820.87
      ]
    },
    "101-250": {
      "1": [
        705.64,
        792.63
      ],
      "2": [
        1405.5,
        1577.67
      ],
      "3": [
        2109.64,
        2373.26
      ],
      "4": [
        2821.49,
        3159.3
      ]
    },
    "251-500": {
      "1": [
        793.25,
        877.49
      ],
      "2": [
        1578.3,
        1754.78
      ],
      "3": [
        2374.52,
        2631.57
      ],
      "4": [
        3159.92,
        3505.6
      ]
    },
    "501-1000": {
      "1": [
        878.12,
        962.37
      ],
      "2": [
        1755.4,
        1928.88
      ],
      "3": [
        2632.2,
        2889.89
      ],
      "4": [
        3506.23,
        3852.38
      ]
    },
    "mais-1000": {
      "1": [
        963.0,
        1050.99
      ],
      "2": [
        1929.51,
        2097.5
      ],
      "3": [
        2890.51,
        3148.81
      ],
      "4": [
        3853.01,
        4161.13
      ]
    }
  },
  "_derivacaoM": "Tabela M derivada da tabela S multiplicando pela razão M/S confirmada nos tetos oficiais de 2025 (~0.6000)."
};
