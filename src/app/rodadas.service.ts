import { Injectable, signal } from '@angular/core';

export interface Jogo {
  id: string;
  time1: string;
  time2: string;
  horario: string;
  data: string;
  rodada: number;
}

export interface Rodada {
  id: string;
  numero: number;
  data: string;
  dataFormatada: string;
  diaSemana: string;
  jogos: Jogo[];
}

@Injectable({
  providedIn: 'root'
})
export class RodadasService {
  private readonly RODADAS_DATA: Rodada[] = [
    {
      id: '1a-rodada-11-06',
      numero: 1,
      data: '2026-06-11',
      dataFormatada: '11/06',
      diaSemana: 'quinta',
      jogos: [
        { id: '1', time1: 'México', time2: 'África do Sul', horario: '16:00', data: '2026-06-11', rodada: 1 },
        { id: '2', time1: 'Coreia do Sul', time2: 'Rep. Tcheca', horario: '23:00', data: '2026-06-11', rodada: 1 }
      ]
    },
    {
      id: '1a-rodada-12-06',
      numero: 1,
      data: '2026-06-12',
      dataFormatada: '12/06',
      diaSemana: 'sexta',
      jogos: [
        { id: '3', time1: 'Canadá', time2: 'Bósnia', horario: '16:00', data: '2026-06-12', rodada: 1 },
        { id: '4', time1: 'EUA', time2: 'Paraguai', horario: '22:00', data: '2026-06-12', rodada: 1 }
      ]
    },
    {
      id: '1a-rodada-13-06',
      numero: 1,
      data: '2026-06-13',
      dataFormatada: '13/06',
      diaSemana: 'sábado',
      jogos: [
        { id: '5', time1: 'Austrália', time2: 'Turquia', horario: '01:00', data: '2026-06-13', rodada: 1 },
        { id: '6', time1: 'Catar', time2: 'Suíça', horario: '16:00', data: '2026-06-13', rodada: 1 },
        { id: '7', time1: 'Brasil', time2: 'Marrocos', horario: '19:00', data: '2026-06-13', rodada: 1 },
        { id: '8', time1: 'Haiti', time2: 'Escócia', horario: '22:00', data: '2026-06-13', rodada: 1 }
      ]
    },
    {
      id: '1a-rodada-14-06',
      numero: 1,
      data: '2026-06-14',
      dataFormatada: '14/06',
      diaSemana: 'domingo',
      jogos: [
        { id: '9', time1: 'Alemanha', time2: 'Curaçao', horario: '14:00', data: '2026-06-14', rodada: 1 },
        { id: '10', time1: 'Holanda', time2: 'Japão', horario: '17:00', data: '2026-06-14', rodada: 1 },
        { id: '11', time1: 'Costa do Marfim', time2: 'Equador', horario: '20:00', data: '2026-06-14', rodada: 1 },
        { id: '12', time1: 'Suécia', time2: 'Tunísia', horario: '23:00', data: '2026-06-14', rodada: 1 }
      ]
    },
    {
      id: '1a-rodada-15-06',
      numero: 1,
      data: '2026-06-15',
      dataFormatada: '15/06',
      diaSemana: 'segunda',
      jogos: [
        { id: '13', time1: 'Espanha', time2: 'Cabo Verde', horario: '13:00', data: '2026-06-15', rodada: 1 },
        { id: '14', time1: 'Bélgica', time2: 'Egito', horario: '16:00', data: '2026-06-15', rodada: 1 },
        { id: '15', time1: 'Arábia Saudita', time2: 'Uruguai', horario: '19:00', data: '2026-06-15', rodada: 1 },
        { id: '16', time1: 'Irã', time2: 'Nova Zelândia', horario: '22:00', data: '2026-06-15', rodada: 1 }
      ]
    },
    {
      id: '1a-rodada-16-06',
      numero: 1,
      data: '2026-06-16',
      dataFormatada: '16/06',
      diaSemana: 'terça',
      jogos: [
        { id: '17', time1: 'França', time2: 'Senegal', horario: '16:00', data: '2026-06-16', rodada: 1 },
        { id: '18', time1: 'Iraque', time2: 'Noruega', horario: '19:00', data: '2026-06-16', rodada: 1 },
        { id: '19', time1: 'Argentina', time2: 'Argélia', horario: '22:00', data: '2026-06-16', rodada: 1 },
        { id: '20', time1: 'Áustria', time2: 'Jordânia', horario: '01:00', data: '2026-06-16', rodada: 1 }
      ]
    },
    {
      id: '1a-rodada-17-06',
      numero: 1,
      data: '2026-06-17',
      dataFormatada: '17/06',
      diaSemana: 'quarta',
      jogos: [
        { id: '21', time1: 'Portugal', time2: 'RD Congo', horario: '14:00', data: '2026-06-17', rodada: 1 },
        { id: '22', time1: 'Inglaterra', time2: 'Croácia', horario: '17:00', data: '2026-06-17', rodada: 1 },
        { id: '23', time1: 'Gana', time2: 'Panamá', horario: '20:00', data: '2026-06-17', rodada: 1 },
        { id: '24', time1: 'Uzbequistão', time2: 'Colômbia', horario: '23:00', data: '2026-06-17', rodada: 1 }
      ]
    },
    {
      id: '2a-rodada-18-06',
      numero: 2,
      data: '2026-06-18',
      dataFormatada: '18/06',
      diaSemana: 'quinta',
      jogos: [
        { id: '25', time1: 'Rep. Tcheca', time2: 'África do Sul', horario: '13:00', data: '2026-06-18', rodada: 2 },
        { id: '26', time1: 'Suíça', time2: 'Bósnia', horario: '16:00', data: '2026-06-18', rodada: 2 },
        { id: '27', time1: 'Canadá', time2: 'Catar', horario: '19:00', data: '2026-06-18', rodada: 2 },
        { id: '28', time1: 'México', time2: 'Coreia do Sul', horario: '22:00', data: '2026-06-18', rodada: 2 }
      ]
    },
    {
      id: '2a-rodada-19-06',
      numero: 2,
      data: '2026-06-19',
      dataFormatada: '19/06',
      diaSemana: 'sexta',
      jogos: [
        { id: '29', time1: 'EUA', time2: 'Austrália', horario: '16:00', data: '2026-06-19', rodada: 2 },
        { id: '30', time1: 'Escócia', time2: 'Marrocos', horario: '19:00', data: '2026-06-19', rodada: 2 },
        { id: '31', time1: 'Brasil', time2: 'Haiti', horario: '21:30', data: '2026-06-19', rodada: 2 },
        { id: '32', time1: 'Turquia', time2: 'Paraguai', horario: '01:00', data: '2026-06-19', rodada: 2 }
      ]
    },
    {
      id: '2a-rodada-20-06',
      numero: 2,
      data: '2026-06-20',
      dataFormatada: '20/06',
      diaSemana: 'sábado',
      jogos: [
        { id: '33', time1: 'Holanda', time2: 'Suécia', horario: '14:00', data: '2026-06-20', rodada: 2 },
        { id: '34', time1: 'Alemanha', time2: 'Costa do Marfim', horario: '17:00', data: '2026-06-20', rodada: 2 },
        { id: '35', time1: 'Equador', time2: 'Curaçao', horario: '21:00', data: '2026-06-20', rodada: 2 },
        { id: '36', time1: 'Tunísia', time2: 'Japão', horario: '01:00', data: '2026-06-20', rodada: 2 }
      ]
    },
    {
      id: '2a-rodada-21-06',
      numero: 2,
      data: '2026-06-21',
      dataFormatada: '21/06',
      diaSemana: 'domingo',
      jogos: [
        { id: '37', time1: 'Espanha', time2: 'Arábia Saudita', horario: '13:00', data: '2026-06-21', rodada: 2 },
        { id: '38', time1: 'Bélgica', time2: 'Irã', horario: '16:00', data: '2026-06-21', rodada: 2 },
        { id: '39', time1: 'Uruguai', time2: 'Cabo Verde', horario: '19:00', data: '2026-06-21', rodada: 2 },
        { id: '40', time1: 'Nova Zelândia', time2: 'Egito', horario: '22:00', data: '2026-06-21', rodada: 2 }
      ]
    },
    {
      id: '2a-rodada-22-06',
      numero: 2,
      data: '2026-06-22',
      dataFormatada: '22/06',
      diaSemana: 'segunda',
      jogos: [
        { id: '41', time1: 'Argentina', time2: 'Áustria', horario: '14:00', data: '2026-06-22', rodada: 2 },
        { id: '42', time1: 'França', time2: 'Iraque', horario: '18:00', data: '2026-06-22', rodada: 2 },
        { id: '43', time1: 'Noruega', time2: 'Senegal', horario: '21:00', data: '2026-06-22', rodada: 2 },
        { id: '44', time1: 'Jordânia', time2: 'Argélia', horario: '00:00', data: '2026-06-22', rodada: 2 }
      ]
    },
    {
      id: '2a-rodada-23-06',
      numero: 2,
      data: '2026-06-23',
      dataFormatada: '23/06',
      diaSemana: 'terça',
      jogos: [
        { id: '45', time1: 'Portugal', time2: 'Uzbequistão', horario: '14:00', data: '2026-06-23', rodada: 2 },
        { id: '46', time1: 'Inglaterra', time2: 'Gana', horario: '17:00', data: '2026-06-23', rodada: 2 },
        { id: '47', time1: 'Panamá', time2: 'Croácia', horario: '20:00', data: '2026-06-23', rodada: 2 },
        { id: '48', time1: 'Colômbia', time2: 'RD Congo', horario: '23:00', data: '2026-06-23', rodada: 2 }
      ]
    },
    {
      id: '3a-rodada-24-06',
      numero: 3,
      data: '2026-06-24',
      dataFormatada: '24/06',
      diaSemana: 'quarta',
      jogos: [
        { id: '49', time1: 'Suíça', time2: 'Canadá', horario: '16:00', data: '2026-06-24', rodada: 3 },
        { id: '50', time1: 'Bósnia', time2: 'Catar', horario: '16:00', data: '2026-06-24', rodada: 3 },
        { id: '51', time1: 'Marrocos', time2: 'Haiti', horario: '19:00', data: '2026-06-24', rodada: 3 },
        { id: '52', time1: 'Escócia', time2: 'Brasil', horario: '19:00', data: '2026-06-24', rodada: 3 }
      ]
    },
    {
      id: '3a-rodada-25-06',
      numero: 3,
      data: '2026-06-25',
      dataFormatada: '25/06',
      diaSemana: 'quinta',
      jogos: [
        { id: '53', time1: 'Coreia do Sul', time2: 'México', horario: '19:00', data: '2026-06-25', rodada: 3 },
        { id: '54', time1: 'África do Sul', time2: 'Rep. Tcheca', horario: '19:00', data: '2026-06-25', rodada: 3 },
        { id: '55', time1: 'Paraguai', time2: 'EUA', horario: '22:00', data: '2026-06-25', rodada: 3 },
        { id: '56', time1: 'Austrália', time2: 'Turquia', horario: '22:00', data: '2026-06-25', rodada: 3 }
      ]
    },
    {
      id: '3a-rodada-26-06',
      numero: 3,
      data: '2026-06-26',
      dataFormatada: '26/06',
      diaSemana: 'sexta',
      jogos: [
        { id: '57', time1: 'Japão', time2: 'Holanda', horario: '17:00', data: '2026-06-26', rodada: 3 },
        { id: '58', time1: 'Suécia', time2: 'Tunísia', horario: '17:00', data: '2026-06-26', rodada: 3 },
        { id: '59', time1: 'Alemanha', time2: 'Costa do Marfim', horario: '20:00', data: '2026-06-26', rodada: 3 },
        { id: '60', time1: 'Equador', time2: 'Curaçao', horario: '20:00', data: '2026-06-26', rodada: 3 }
      ]
    },
    {
      id: '3a-rodada-27-06',
      numero: 3,
      data: '2026-06-27',
      dataFormatada: '27/06',
      diaSemana: 'sábado',
      jogos: [
        { id: '61', time1: 'Egito', time2: 'Bélgica', horario: '13:00', data: '2026-06-27', rodada: 3 },
        { id: '62', time1: 'Irã', time2: 'Espanha', horario: '13:00', data: '2026-06-27', rodada: 3 },
        { id: '63', time1: 'Uruguai', time2: 'Arábia Saudita', horario: '16:00', data: '2026-06-27', rodada: 3 },
        { id: '64', time1: 'Cabo Verde', time2: 'Nova Zelândia', horario: '16:00', data: '2026-06-27', rodada: 3 },
        { id: '65', time1: 'Senegal', time2: 'França', horario: '16:00', data: '2026-06-27', rodada: 3 },
        { id: '66', time1: 'Noruega', time2: 'Iraque', horario: '16:00', data: '2026-06-27', rodada: 3 },
        { id: '67', time1: 'Argélia', time2: 'Argentina', horario: '16:00', data: '2026-06-27', rodada: 3 },
        { id: '68', time1: 'Jordânia', time2: 'Áustria', horario: '16:00', data: '2026-06-27', rodada: 3 },
        { id: '69', time1: 'Croácia', time2: 'Inglaterra', horario: '17:00', data: '2026-06-27', rodada: 3 },
        { id: '70', time1: 'Panamá', time2: 'Gana', horario: '17:00', data: '2026-06-27', rodada: 3 },
        { id: '71', time1: 'Colômbia', time2: 'Portugal', horario: '20:00', data: '2026-06-27', rodada: 3 },
        { id: '72', time1: 'RD Congo', time2: 'Uzbequistão', horario: '20:00', data: '2026-06-27', rodada: 3 }
      ]
    }
  ];

  readonly rodadas = signal<Rodada[]>(this.RODADAS_DATA);

  getRodadas(): Rodada[] {
    return this.rodadas();
  }

  getRodadasDoBrasil(): Rodada[] {
    return this.rodadas()
      .map(rodada => ({
        ...rodada,
        jogos: rodada.jogos.filter(jogo => this.isJogoDoBrasil(jogo))
      }))
      .filter(rodada => rodada.jogos.length > 0);
  }

  private isJogoDoBrasil(jogo: Jogo): boolean {
    const time1 = jogo.time1.trim().toLowerCase();
    const time2 = jogo.time2.trim().toLowerCase();
    return time1 === 'brasil' || time2 === 'brasil';
  }

  getRodadaPorData(data: string): Rodada | undefined {
    return this.rodadas().find(r => r.data === data);
  }

  getJogosPorRodada(numeroRodada: number): Rodada[] {
    return this.rodadas().filter(r => r.numero === numeroRodada);
  }
}
