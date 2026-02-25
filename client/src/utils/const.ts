export const UserStatus = {
    ACTIVE: {value: 'active', label: 'Aktivní'},
    INACTIVE: {value: 'inactive', label: 'Neaktivní'}
}

export const ParticipationStatus = {
    CONFIRMED: {value: 'confirmed', label: 'Potvrzeno'},
    DECLINED: {value: 'declined', label: 'Odmítnuto'},
    PENDING: {value: 'pending', label: 'Čekající'}
}

export const EventType = {
    TRAINING: {value: "training", label: "Trénink"},
    MATCH: {value: "match", label: "Zápas"},
    OTHER: {value: "other", label: "Jiné"}
}

export const PaymentType = {
    MEMBERSHIP: {value: "membership", label: "Členství"},
    FINES: {value: "fines", label: "Pokuty"},
    OTHER: {value: "other", label: "Jiné"}
}

export const PaymentStatus = {
    PENDING: {value: "pending", label: "Čekající"},
    COMPLETED: {value: "completed", label: "Dokončeno"},
    FAILED: {value: "failed", label: "Neúspěšné"}
}