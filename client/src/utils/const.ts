export const UserStatus = {
    ACTIVE: {value: 'active', label: 'Aktivní'},
    INACTIVE: {value: 'inactive', label: 'Neaktivní'}
}

export const ParticipationStatus = {
    CONFIRMED: {value: 'confirmed', label: 'Jde'},
    MAYBE: {value: 'maybe', label: 'Možná'},
    DECLINED: {value: 'declined', label: 'Nejde'},
    PENDING: {value: 'pending', label: 'Bez odpovědi'}
}

export const EventStatus = {
    SCHEDULED: {value: 'scheduled', label: 'Naplánováno'},
    CANCELED: {value: 'canceled', label: 'Zrušeno'}
}

export const RecurrenceFrequency = {
    DAILY: {value: 'daily', label: 'Denně'},
    WEEKLY: {value: 'weekly', label: 'Týdně'},
    MONTHLY: {value: 'monthly', label: 'Měsíčně'}
}

// Monday first, values match Date.getDay() (0 = Sunday)
export const Weekdays = [
    {value: 1, short: 'Po', label: 'pondělí'},
    {value: 2, short: 'Út', label: 'úterý'},
    {value: 3, short: 'St', label: 'středa'},
    {value: 4, short: 'Čt', label: 'čtvrtek'},
    {value: 5, short: 'Pá', label: 'pátek'},
    {value: 6, short: 'So', label: 'sobota'},
    {value: 0, short: 'Ne', label: 'neděle'}
]

export const EditScopeOptions = {
    THIS: {value: 'this', label: 'Jen tato událost'},
    FOLLOWING: {value: 'following', label: 'Tato a všechny následující'},
    ALL: {value: 'all', label: 'Všechny nadcházející události série'}
}

export const EventType = {
    TRAINING: {value: "training", label: "Trénink"},
    MATCH: {value: "match", label: "Zápas"},
    OTHER: {value: "other", label: "Jiné"}
}

export const PaymentType = {
    MEMBERSHIP: {value: "membership", label: "Příspěvek"},
    FINES: {value: "fines", label: "Pokuta"},
    OTHER: {value: "other", label: "Jiné"}
}

export const PaymentStatus = {
    PENDING: {value: "pending", label: "Nezaplaceno"},
    COMPLETED: {value: "completed", label: "Zaplaceno"},
    FAILED: {value: "failed", label: "Platba selhala"}
}

export const LeagueCategory = {
    JUNIORS: {value: 'juniors', label: 'Junioři'},
    CADETS: {value: 'cadets', label: 'Kadeti'},
    MEN: {value: 'men', label: 'Muži'},
    OLDER_PUPILS: {value: 'older_pupils', label: 'Starší žáci'},
    YOUNGER_PUPILS: {value: 'younger_pupils', label: 'Mladší žáci'}
}

export const SquadRole = {
    PLAYER: {value: 'player', label: 'Hráč'},
    COACH: {value: 'coach', label: 'Trenér'}
}
export const PlayerPosition = {
    GOALKEEPER: {value: 'goalkeeper', label: 'Brankář', plural: 'Brankáři'},
    DEFENDER: {value: 'defender', label: 'Obránce', plural: 'Obránci'},
    FORWARD: {value: 'forward', label: 'Útočník', plural: 'Útočníci'}
}
