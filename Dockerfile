FROM node:lts-alpine3.10
RUN apk update && \
    apk --no-cache add curl && \  
    sh -ci "$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)"
ENV PATH="/root/.local/bin:${PATH}"
WORKDIR '/app'
COPY . ./
RUN npm install
CMD ["npm", "run", "test"]
EXPOSE 3000/tcp