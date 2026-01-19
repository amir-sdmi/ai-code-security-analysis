export { }
import { IEventHandler } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs/dist/decorators/events-handler.decorator';
import { PolicyQuery } from '../../Services/WebAdmin/Queries/PolicyQuery'
import { PolicyAppliedEvent } from '../../Events'
import { SearchClient } from '../../Elastic/app'
import { PolicySearchReport } from '../../Reports/Entities/policy'
import { CommandBus } from '@nestjs/cqrs';
import { Guid } from 'guid-typescript';
import { FileLogger } from "../../SMERSH/Utilities/FileLogger";
import { SteamBot } from '../../SMERSH/Utilities/steam'
import { Action } from '../../SMERSH/ValueObjects';
import { Logger } from '../../Discord/Framework';

let cls: { new(id: Guid): PolicySearchReport } = PolicySearchReport;

@EventsHandler(PolicyAppliedEvent)
export class PolicyAppliedEventHandler implements IEventHandler<PolicyAppliedEvent>
{
    public constructor(protected readonly commandBus: CommandBus) {
        this.log = new FileLogger(`../logs/info-${new Date().toISOString().split('T')[0]}-${this.constructor.name}.log`)

        this.steam = SteamBot.get();
    }

    public log: FileLogger;

    public steam: SteamBot;


    async handle(event: PolicyAppliedEvent) {
        let policy = new cls(event.Id);


        //this.log.info(JSON.stringify(event))
        policy.PlayerId = event.PlayerId.toString();
        policy.ChannelId = event.ChannelId;
        policy.Action = event.Action;
        policy.Name = event.Name;
        policy.Reason = event.Reason;
        policy.Executioner = event.Executioner;
        policy.BanDate = event.BanDate;
        policy.UnbanDate = event.UnbanDate;
        policy.PlainId = event.PlainId;
        policy.IsActive = true;

        await SearchClient.Put(policy);
        let action = ''
        let duration = ''
        let reason = ' for no reason'

        switch (event.Action) {
            case Action.Kick.DisplayName: {
                action = 'kicked'
            } break;
            case Action.SessionBan.DisplayName: {
                action = 'session banned'
                duration = 'until the match is over'
            } break;
            case Action.Ban.DisplayName: {
                action = 'banned'
            } break;
            case Action.IpBan.DisplayName: {
                action = 'ip banned'
            } break;
            case Action.Mute.DisplayName: {
                action = 'muted'
            } break;
        }

        if (event.Reason) {
            reason = ` for ${event.Reason}`
        }

        if (event.UnbanDate) {
            duration = ` until ${event.UnbanDate.toString().split(' GMT')[0]}`
        }
        const discord = event.Action !== Action.Kick.DisplayName ? `\nplease make a ticket on our discord if you disagree with this decision: https://discord.gg/43XsqZB` : ''
        const message = `\nYou have been ${action}${reason}${duration}.${discord}`

        Logger.append(`${event.Name} was ${action}${event.Executioner ? ` by ${event.Executioner}` : ''}${reason}${duration}`)

        await this.steam.sendMessageToFriend(event.PlayerId, `/pre this is an automated message integrated with ChatGPT`)
        await this.steam.sendMessageToFriend(event.PlayerId, message)
        return;
    }
}