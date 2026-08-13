export interface Subplot {
  id: string;
  name: string;
  description: string;
  /**
   * The plot's colour on the canvas and in the rail.
   *
   * Optional and additive, so no migration: `subplotColour` derives one from the
   * plot's position when it is absent, which is what every story written before this
   * relies on.
   */
  color?: string;
}
