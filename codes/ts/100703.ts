import { MetodoEntrega } from "../types/Checkout.interface"
import { BadRequestError } from "../types/erros/BadRequestError"

export class CommonHelper {
    static validarInput(schema: string[], requestBody: any) {
        schema.forEach(param => {
            if(!(param in requestBody)) {
                throw new BadRequestError(`Erro na validação do payload. Parâmetro '${ param }' está faltando.`)
            }
        })
    }

    static getEntregaLocal(): MetodoEntrega[] {
        return [
            {
                nome: 'Entrega local',
                valor: 15,
                prazo: 2
            }, 
            {
                nome: 'Retirada em loja',
                valor: 0,
                prazo: 1
            }
        ]
    }

    /** The following code was generated with ChatGPT */
    static addBusinessDays(date: Date, days: number): Date {
        let result = new Date(date)
        let addedDays = 0
      
        while (addedDays < days) {
          result.setDate(result.getDate() + 1)

          if (this.isWeekday(result)) {
            addedDays++
          }
        }
      
        return result
    }

    static isWeekday(date: Date): boolean {
        const day = date.getDay()

        // 0 = Domingo, 6 = Sábado
        return day !== 0 && day !== 6 
    }
      
    static addDays(date: Date, days: number): Date {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
    }
}