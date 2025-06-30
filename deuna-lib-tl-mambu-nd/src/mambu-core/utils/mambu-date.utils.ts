export class MambuDateUtils {
  static formatISODate(date: Date): string {
    const { year, month, day, hours, minutes, seconds } =
      MambuDateUtils.splitDate(date);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
  }

  static splitDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return { year, month, day, hours, minutes, seconds };
  }

  static formatValueDate(date: Date): string {
    const { year, month, day } = MambuDateUtils.splitDate(date);
    return `${year}-${month}-${day}`;
  }
}
