import { copilotApi } from 'copilot-node-sdk'
import type { CopilotAPI as SDK } from 'copilot-node-sdk'
import {
  ClientResponse,
  ClientResponseSchema,
  ClientsResponseSchema,
  CompanyResponse,
  CompanyResponseSchema,
  ClientRequest,
  CustomFieldResponse,
  CustomFieldResponseSchema,
  MeResponse,
  MeResponseSchema,
  CompaniesResponse,
  CompaniesResponseSchema,
  WorkspaceResponse,
  WorkspaceResponseSchema,
  Token,
  TokenSchema,
  InternalUserTokenSchema,
  InternalUserToken,
  InternalUsersResponse,
  InternalUsersResponseSchema,
  ChannelResponse,
  ChannelResponseSchema,
  ChannelsResponseSchema,
  ChannelsResponse,
  InternalUsers,
  InternalUsersSchema,
  MessageResponseSchema,
  CopilotUser,
} from '@/types/common'
import { copilotAPIKey as apiKey } from '@/config'

export class CopilotAPI {
  copilot: SDK

  constructor(token: string) {
    this.copilot = copilotApi({ apiKey, token })
  }

  private async getTokenPayload(): Promise<Token | null> {
    const getTokenPayload = this.copilot.getTokenPayload
    if (!getTokenPayload) return null

    return TokenSchema.parse(await getTokenPayload())
  }

  async me(): Promise<MeResponse | null> {
    const tokenPayload = await this.getTokenPayload()
    const id = tokenPayload?.internalUserId || tokenPayload?.clientId
    if (!tokenPayload || !id) return null

    const retrieveCurrentUserInfo = tokenPayload.internalUserId
      ? this.copilot.retrieveInternalUser
      : this.copilot.retrieveClient
    const currentUserInfo = await retrieveCurrentUserInfo({ id })

    return MeResponseSchema.parse(currentUserInfo)
  }

  async getWorkspace(): Promise<WorkspaceResponse> {
    return WorkspaceResponseSchema.parse(await this.copilot.retrieveWorkspace())
  }

  async getInternalUserTokenPayload(): Promise<InternalUserToken | null> {
    const tokenPayload = await this.getTokenPayload()
    const payload = InternalUserTokenSchema.safeParse(tokenPayload)
    return payload.data ?? null
  }

  async getClient(id: string): Promise<ClientResponse> {
    return ClientResponseSchema.parse(await this.copilot.retrieveClient({ id }))
  }

  async getClients() {
    return ClientsResponseSchema.parse(await this.copilot.listClients({}))
  }

  async updateClient(id: string, requestBody: ClientRequest): Promise<ClientResponse> {
    // @ts-ignore
    return ClientResponseSchema.parse(await this.copilot.updateClient({ id, requestBody }))
  }

  async getCompany(id: string): Promise<CompanyResponse> {
    return CompanyResponseSchema.parse(await this.copilot.retrieveCompany({ id }))
  }

  async getCompanies(): Promise<CompaniesResponse> {
    return CompaniesResponseSchema.parse(await this.copilot.listCompanies({}))
  }

  async getCustomFields(): Promise<CustomFieldResponse> {
    return CustomFieldResponseSchema.parse(await this.copilot.listCustomFields())
  }

  async getInternalUser(id: string): Promise<InternalUsers> {
    return InternalUsersSchema.parse(await this.copilot.retrieveInternalUser({ id }))
  }

  async getInternalUsers(): Promise<InternalUsersResponse> {
    return InternalUsersResponseSchema.parse(await this.copilot.listInternalUsers({}))
  }

  async getMessageChannel(id: string): Promise<ChannelResponse> {
    return ChannelResponseSchema.parse(await this.copilot.retrieveMessageChannel({ id }))
  }

  async getMessageChannels(): Promise<ChannelsResponse> {
    return ChannelsResponseSchema.parse(await this.copilot.listMessageChannels({}))
  }

  async sendMessage(senderId: string, channelId: string, text: string) {
    return MessageResponseSchema.parse(await this.copilot.sendMessage({ requestBody: { channelId, text, senderId } }))
  }

  async getUserByEmail(email: string): Promise<CopilotUser | null> {
    const internalUsers = await this.getInternalUsers()
    const matchingInternalUser = internalUsers.data.find((user) => user.email === email)
    if (matchingInternalUser) return matchingInternalUser

    const clients = await this.getClients()
    return clients.data?.find((user) => user.email === email) ?? null
  }

  /**
   * Get the username for a given id. ID can be a client, IU, or company with no way to identify them apart.
   * @param id User / company id
   * @returns Formatted name of the client / IU / company
   */
  async getUserNameById(id: string): Promise<string> {
    // Check if user is an IU by using copilot internal users retrieve endpoint
    try {
      const internalUser = await this.getInternalUser(id)
      return `${internalUser.givenName} ${internalUser.familyName}`
    } catch (_) {}
    // Check if user id has a matching client
    try {
      const client = await this.getClient(id)
      return `${client.givenName} ${client.familyName}`
    } catch (_) {} // Continue to next try-catch block
    // Check if user id has a matching company
    try {
      const company = await this.getCompany(id)
      return company.name
    } catch (err: unknown) {
      // No match found for iu / client / company
      console.error(`No user found by id ${id}`)
      return ''
    }
  }
}
