import { manifest } from "../../Lib/compass_navigator";
import Control from "./control";

export const ControlWindow = manifest(Control, {
  initialTitle: () => "Controle de PWM",
  hasAnimation: true,
});
