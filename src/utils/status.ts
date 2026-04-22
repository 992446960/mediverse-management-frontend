export type StatusValue = 'active' | 'inactive'

const STATUS_COLOR_MAP: Record<StatusValue, string> = {
  active: 'green',
  inactive: 'default',
}

const STATUS_LABEL_MAP: Record<StatusValue, string> = {
  active: 'status.active',
  inactive: 'status.inactive',
}

export function getStatusColor(status: StatusValue): string {
  return STATUS_COLOR_MAP[status] ?? 'default'
}

export function getStatusLabelKey(status: StatusValue): string {
  return STATUS_LABEL_MAP[status] ?? 'status.unknown'
}
