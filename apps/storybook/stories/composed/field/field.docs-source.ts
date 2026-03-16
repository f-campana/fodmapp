export const fieldRecommendedUsageCode = `import { Field } from "@fodmapp/ui/field";
import { Input } from "@fodmapp/ui/input";

export function Example() {
  return (
    <fieldset>
      <legend>Coordonnees du suivi</legend>
      <Field id="contact-name" label="Nom complet" required>
        <Input />
      </Field>
      <Field
        id="contact-email"
        label="Adresse email"
        hint="Adresse utilisee pour les comptes rendus."
      >
        <Input type="email" />
      </Field>
    </fieldset>
  );
}
`;
