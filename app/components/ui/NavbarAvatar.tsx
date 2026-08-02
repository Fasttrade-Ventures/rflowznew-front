import { Avatar, UnstyledButton } from "@mantine/core";
import { forwardRef } from "react";

interface NavbarAvatarProps extends React.ComponentPropsWithoutRef<"button"> {
  username: string;
}

const NavbarAvatar = forwardRef<HTMLButtonElement, NavbarAvatarProps>(
  ({ username, ...others }: NavbarAvatarProps, ref) => (
    <UnstyledButton
      ref={ref}
      style={{
        padding: 0,
      }}
      {...others}
    >
      <Avatar alt={username} size="md" variant="light">
        {username.charAt(0).toUpperCase()}
      </Avatar>
    </UnstyledButton>
  )
);

NavbarAvatar.displayName = "NavbarAvatar";

export default NavbarAvatar;
