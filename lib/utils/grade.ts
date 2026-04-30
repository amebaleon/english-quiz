export function gradeLabel(birthYear: number | null | undefined): string {
  if (!birthYear) return ''
  const grade = new Date().getFullYear() - birthYear - 5
  if (grade < 1 || grade > 12) return `${birthYear}년생`
  if (grade <= 6) return `초${grade}`
  if (grade <= 9) return `중${grade - 6}`
  return `고${grade - 9}`
}

export function gradeNumber(birthYear: number | null | undefined): number | null {
  if (!birthYear) return null
  const grade = new Date().getFullYear() - birthYear - 5
  if (grade < 1 || grade > 12) return null
  return grade
}
