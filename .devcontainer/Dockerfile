# https://carlos.mendible.com/2020/01/10/vs-code-remote-containers-jekyll/

FROM ubuntu:22.04

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# This Dockerfile adds a non-root 'vscode' user with sudo access. However, for Linux,
# this user's GID/UID must match your local user UID/GID to avoid permission issues
# with bind mounts. Update USER_UID / USER_GID if yours is not 1000. See
# https://aka.ms/vscode-remote/containers/non-root-user for details.
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Configure apt and install packages
RUN apt-get update \
    && apt-get -y install --no-install-recommends apt-utils dialog 2>&1 \
    #
    # Install vim, git, process tools, lsb-release
    && apt-get install -y git curl coreutils procps bash \
    #
    # Install ruby
    && apt-get install -y \
        make \
        build-essential \
        ruby \
        ruby-dev \
    # Install libraries (including nokogiri dependencies)
    && apt-get install -y \
        zlib1g-dev \
        libxml2-dev \
        libxslt1-dev \
        pkg-config \
    #
    # Install Node.js (for JSON Resume)
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    #
    # Create a non-root user to use if preferred - see https://aka.ms/vscode-remote/containers/non-root-user.
    && (getent group $USER_GID >/dev/null 2>&1 || groupadd --gid $USER_GID $USERNAME) \
    && (getent passwd $USER_UID >/dev/null 2>&1 || useradd -s /bin/bash --uid $USER_UID --gid $USER_GID -m $USERNAME) \
    # [Optional] Add sudo support for the non-root user
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME\
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    #
    # Install jekyll as root (system-wide)
    && gem install \
        bundler \
        jekyll \
    #
    # Install resume-cli globally
    && npm install -g resume-cli \
    #
    #
    # Create output directory
    && mkdir /srv/jekyll \
    && chown vscode /srv/jekyll \
    #
    # Set up proper environment for vscode user
    && echo 'export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"' >> /home/$USERNAME/.bashrc \
    && echo 'cd /workspace' >> /home/$USERNAME/.bashrc \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=dialog
