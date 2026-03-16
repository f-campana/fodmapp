export const avatarRecommendedUsageCode = `import { Avatar, AvatarFallback, AvatarImage } from "@fodmapp/ui/avatar";

export function Example() {
  return (
    <Avatar className="size-12">
      <AvatarImage alt="Camille profile photo" src="/images/camille.jpg" />
      <AvatarFallback>CF</AvatarFallback>
    </Avatar>
  );
}
`;
